# typed: false

require 'bundler/setup'
require 'securerandom'

require 'truemail'

require 'erb'
require 'syslog'

require 'encryptor'
require 'bcrypt'

require 'sendgrid-ruby'

require 'rack'
require 'otto'
require 'gibbler/mixins'
require 'familia'
require 'storable'
require 'sysinfo'

require_relative 'onetime/core_ext'
require_relative 'onetime/refinements/horreum_refinements'

# Ensure immediate flushing of stdout to improve real-time logging visibility.
# This is particularly useful in development and production environments where
# timely log output is crucial for monitoring and debugging purposes.
#
# Enabling sync can have a performance impact in high-throughput environments.
#
# NOTE: Use STDOUT the immuntable constant here, not $stdout (global var).
#
STDOUT.sync = ENV['STDOUT_SYNC'] && %w[true yes 1].include?(ENV['STDOUT_SYNC'])

# Onetime is the core of the Onetime Secret application.
# It contains the core classes and modules that make up
# the app. It is the main namespace for the application.
#
module Onetime
  unless defined?(Onetime::HOME)
    HOME = File.expand_path(File.join(File.dirname(__FILE__), '..'))
    ERRNO = {}
  end
  @mode = :app

  module ClassMethods
    attr_accessor :mode
    attr_reader :conf, :locales, :instance, :sysinfo, :emailer, :global_secret, :global_banner
    attr_writer :debug

    def debug
      @debug ||= ENV['ONETIME_DEBUG'].to_s.match?(/^(true|1)$/i)
    end

    def debug?
      !!debug # force a boolean
    end

    def mode?(guess)
      @mode.to_s == guess.to_s
    end

    def now
      Time.now.utc
    end

    def entropy
      SecureRandom.hex
    end

    def boot!(mode = nil)
      OT.mode = mode unless mode.nil?
      @conf = OT::Config.load # load config before anything else.
      OT::Config.after_load(@conf)

      Familia.uri = OT.conf[:redis][:uri]
      @sysinfo ||= SysInfo.new.freeze
      @instance ||= [OT.sysinfo.hostname, OT.sysinfo.user, $$, OT::VERSION.to_s, OT.now.to_i].gibbler.freeze

      load_locales
      set_global_secret
      prepare_emailers
      prepare_rate_limits
      load_fortunes
      load_plans
      connect_databases
      check_global_banner
      print_log_banner unless mode?(:test)

      @conf # return the config

    rescue OT::Problem => e
      OT.le "Problem booting: #{e}"
      OT.ld e.backtrace.join("\n")
      exit 1
    rescue Redis::CannotConnectError => e
      OT.le "Cannot connect to redis #{Familia.uri} (#{e.class})"
      exit 10
    rescue StandardError => e
      OT.le "Unexpected error `#{e}` (#{e.class})"
      exit 99
    end

    def info(*msgs)
      return unless mode?(:app) || mode?(:cli) # can reduce output in tryouts
      msg = msgs.join("#{$/}")
      stdout("I", msg)
    end

    def li(*msgs)
      msg = msgs.join("#{$/}")
      stdout("I", msg)
    end

    def le(*msgs)
      msg = msgs.join("#{$/}")
      stderr("E", msg)
    end

    def ld(*msgs)
      return unless Onetime.debug
      msg = msgs.join("#{$/}")
      stderr("D", msg)
    end

    private

    def prepare_emailers
      @emailer = Onetime::App::Mail::SMTPMailer
      @emailer.setup
    end

    def set_global_secret
      @global_secret = OT.conf[:site][:secret] || 'CHANGEME'
      unless Gibbler.secret && Gibbler.secret.frozen?
        Gibbler.secret = global_secret.freeze
      end
    end

    def prepare_rate_limits
      OT::RateLimit.register_events OT.conf[:limits]
    end

    def load_fortunes
      OT::Utils.fortunes ||= File.readlines(File.join(Onetime::HOME, 'etc', 'fortunes'))
    end

    def check_global_banner
      @global_banner = Familia.redis(0).get('global_banner')
      OT.li "Global banner: #{OT.global_banner}" if global_banner
    end

    def print_log_banner
      redis_info = Familia.redis.info
      OT.li "---  ONETIME #{OT.mode} v#{OT::VERSION.inspect}  #{'---' * 3}"
      OT.li "system: #{@sysinfo.platform} (ruby #{RUBY_VERSION})"
      OT.li "config: #{OT::Config.path}"
      OT.li "redis: #{redis_info['redis_version']} (#{Familia.uri.serverid})"
      OT.li "familia: v#{Familia::VERSION}"
      OT.li "colonels: #{OT.conf[:colonels].join(', ')}"
      if OT.conf[:site].key?(:authentication)
        OT.li "auth: #{OT.conf[:site][:authentication].map { |k,v| "#{k}=#{v}" }.join(', ')}"
      end
      if OT.conf[:site].key?(:domains)
        OT.li "domains: #{OT.conf[:site][:domains].map { |k,v| "#{k}=#{v}" }.join(', ')}"
      end
      if OT.conf[:site].key?(:regions)
        OT.li "regions: #{OT.conf[:site][:regions].map { |k,v| "#{k}=#{v}" }.join(', ')}"
      end
      if OT.conf.fetch(:development, false)
        OT.li "development: #{OT.conf[:development].map { |k,v| "#{k}=#{v}" }.join(', ')}"
      end
      if OT.conf[:emailer]
        email_config = OT.conf[:emailer]
        mail_settings = {
          smtp: "#{email_config[:host]}:#{email_config[:port]}",
          from: email_config[:from],
          mode: email_config[:mode],
          tls: email_config[:tls],
          auth: email_config[:auth], # this is an smtp feature and not credentials
        }.map { |k,v| "#{k}=#{v}" }.join(', ')
        OT.li "mail: #{mail_settings}"
      end
      if OT.conf.fetch(:experimental, false)
        OT.li "experimental: #{OT.conf[:experimental].map { |k,v| "#{k}=#{v}" }.join(', ')}"
      end
      OT.li "locales: #{@locales.keys.join(', ')}"
      OT.li "secret options: #{OT.conf.dig(:site, :secret_options)}"
      OT.li "rate limits: #{OT::RateLimit.events.map { |k,v| "#{k}=#{v}" }.join(', ')}"
    end

    def load_plans
      OT::Plan.load_plans!
    end

    using Familia::HorreumRefinements

    # Connects each model to its configured Redis database.
    #
    # This method retrieves the Redis database configurations from the application
    # settings and establishes connections for each model class within the Familia
    # module. It assigns the appropriate Redis connection to each model and verifies
    # the connection by sending a ping command. Detailed logging is performed at each
    # step to facilitate debugging and monitoring.
    #
    # @example
    #   connect_databases
    #
    # @return [void]
    #
    def connect_databases
      # Connect each model to its configured Redis database
      dbs = OT.conf.dig(:redis, :dbs)

      OT.ld "[connect_databases] dbs: #{dbs}"

      # Map model classes to their database numbers
      Familia.members.each do |model_class|
        model_sym = model_class.to_sym
        db_index = dbs[model_sym] || DATABASE_IDS[model_sym] || 0 # see models.rb

        # Assign a Redis connection to the model class
        model_class.redis = Familia.redis(db_index)
        ping_result = model_class.redis.ping

        OT.ld "Connected #{model_sym} to DB #{db_index} (#{ping_result})"
      end
    end

    def load_locales(locales = OT.conf[:locales] || ['en'])
      confs = locales.collect do |locale|
        path = File.join(Onetime::HOME, 'src', 'locales', "#{locale}.json")
        OT.ld "Loading locale #{locale}: #{File.exist?(path)}"
        conf = JSON.parse(File.read(path), symbolize_names: true)
        [locale, conf]
      end

      # Convert the zipped array to a hash
      locales = confs.to_h
      # Make sure the default locale is first
      default_locale = locales[OT.conf[:locales].first]
      # Here we overlay each locale on top of the default just
      # in case there are keys that haven't been translated.
      # That way, at least the default language will display.
      locales.each do |key, locale|
        locales[key] = OT::Utils.deep_merge(default_locale, locale) if default_locale != locale
      end
      @locales = locales
    end

    def stdout(prefix, msg)
      return if STDOUT.closed?

      stamp = Time.now.to_i
      logline = "%s(%s): %s" % [prefix, stamp, msg]
      STDOUT.puts(logline)
    end

    def stderr(prefix, msg)
      return if STDERR.closed?

      stamp = Time.now.to_i
      logline = "%s(%s): %s" % [prefix, stamp, msg]
      STDERR.puts(logline)
    end
  end

  extend ClassMethods
end

require_relative 'onetime/errors'
require_relative 'onetime/utils'
require_relative 'onetime/version'
require_relative 'onetime/config'
require_relative 'onetime/plan'
require_relative 'onetime/alias'
require_relative 'onetime/models'
require_relative 'onetime/logic'
require_relative 'onetime/app'
