require_relative 'view_helpers'
require_relative 'vite_helpers'

module Onetime
  module App

    class View < Mustache
      include Onetime::App::Views::ViewHelpers
      include Onetime::App::Views::ViteHelpers
      include Onetime::TimeUtils

      self.template_path = './templates/web'
      self.template_extension = 'html'
      self.view_namespace = Onetime::App::Views
      self.view_path = './app/web/views'

      attr_reader :req, :plan, :is_paid, :canonical_domain, :display_domain, :domain_strategy
      attr_reader :domain_id, :domain_branding, :domain_logo, :custom_domain
      attr_accessor :sess, :cust, :locale, :messages, :form_fields, :pagename

      def initialize req, sess=nil, cust=nil, locale=nil, *args # rubocop:disable Metrics/MethodLength
        @req, @sess, @cust, @locale = req, sess, cust, locale
        @locale ||= req.env['ots.locale'] || OT.conf[:locales].first.to_s || 'en' unless req.nil?
        @messages ||= []
        site = OT.conf.fetch(:site, {})
        is_default_locale = OT.conf[:locales].first.to_s == locale
        supported_locales = OT.conf.fetch(:locales, []).map(&:to_s)

        @canonical_domain = Onetime::DomainStrategy.canonical_domain
        @domain_strategy = req.env['onetime.domain_strategy'] # never nil
        @display_domain = req.env['onetime.display_domain'] # can be nil
        if @domain_strategy == :custom
          @custom_domain = OT::CustomDomain.from_display_domain(@display_domain)
          @domain_id = custom_domain&.domainid
          @domain_branding = (custom_domain&.brand&.hgetall || {}).to_h # bools are strings
          @domain_logo = (custom_domain&.logo&.hgetall || {}).to_h # ditto
        end

        # TODO: Make better use of fetch/dig to avoid nil checks. Esp important
        # across release versions where the config may change and existing
        # installs may not have had a chance to update theirs yet.
        secret_options = site.fetch(:secret_options, {})
        domains = site.fetch(:domains, {})
        regions = site.fetch(:regions, {})
        authentication = site.fetch(:authentication, {})
        support_host = site.dig(:support, :host) # defaults to nil
        incoming_recipient = OT.conf.dig(:incoming, :email)

        # If not set, the frontend_host is the same as the site_host and
        # we can leave the absolute path empty as-is without a host.
        development = OT.conf.fetch(:development, {})
        frontend_development = development[:enabled] || false
        frontend_host = development[:frontend_host] || ''

        cust ||= OT::Customer.anonymous
        authenticated = sess && sess.authenticated? && ! cust.anonymous?

        domains_enabled = domains[:enabled] || false
        regions_enabled = regions[:enabled] || false

        # Regular template vars used one
        self[:description] = i18n[:COMMON][:description]
        self[:keywords] = i18n[:COMMON][:keywords]
        self[:page_title] = "Onetime Secret"
        self[:frontend_host] = frontend_host
        self[:frontend_development] = frontend_development
        self[:no_cache] = false

        self[:jsvars] = {}

        # Add the nonce to the jsvars hash if it exists. See `carefully`.
        self[:nonce] = req.env.fetch('ots.nonce', nil)

        # Add the global site banner if there is one
        self[:jsvars][:global_banner] = jsvar(OT.global_banner) if OT.global_banner

        # Pass the authentication flag settings to the frontends.
        self[:jsvars][:authentication] = jsvar(authentication) # nil is okay
        self[:jsvars][:shrimp] = jsvar(sess.add_shrimp) if sess

        # Only send the regions config when the feature is enabled.
        self[:jsvars][:regions_enabled] = jsvar(regions_enabled)
        self[:jsvars][:regions] = jsvar(regions) if regions_enabled

        # Ensure that these keys are always present in jsvars, even if nil
        ensure_exist = [:domains_enabled, :custid, :cust, :email, :customer_since, :custom_domains]

        self[:jsvars][:domains_enabled] = jsvar(domains_enabled) # only for authenticated

        if authenticated && cust
          self[:jsvars][:custid] = jsvar(cust.custid)
          self[:jsvars][:cust] = jsvar(cust.safe_dump)
          self[:jsvars][:email] = jsvar(cust.email)

          # TODO: We can remove this after we update the Account view to use
          # the value of cust.created to calculate the customer_since value
          # on-the-fly and in the time zone of the user.
          self[:jsvars][:customer_since] = jsvar(epochdom(cust.created))

          # There's no custom domain list when the feature is disabled.
          if domains_enabled
            custom_domains = cust.custom_domains_list.filter_map do |obj|
              # Only verified domains that resolve
              unless obj.ready?
                # For now just log until we can reliably re-attempt verification and
                # have some visibility which customers this will affect. We've made
                # the verification more stringent so currently many existing domains
                # would return obj.ready? == false.
                OT.li "[custom_domains] Allowing unverified domain: #{obj.display_domain} (#{obj.verified}/#{obj.resolving})"
              end

              obj.display_domain
            end
            self[:jsvars][:custom_domains] = jsvar(custom_domains.sort)
          end
        else
          # We do this so that in our typescript we can assume either a value
          # or nil (null), avoiding undefined altogether.
          ensure_exist.each do |key|
            self[:jsvars][key] = jsvar(nil)
          end
        end

        @messages = sess.get_messages || [] unless sess.nil?

        # Link to the pricing page can be seen regardless of authentication status
        self[:jsvars][:plans_enabled] = jsvar(site.dig(:plans, :enabled) || false)
        self[:jsvars][:locale] = jsvar(@locale)
        self[:jsvars][:is_default_locale] = jsvar(is_default_locale)
        self[:jsvars][:supported_locales] = jsvar(supported_locales)

        self[:jsvars][:incoming_recipient] = jsvar(incoming_recipient)
        self[:jsvars][:support_host] = jsvar(support_host)
        self[:jsvars][:secret_options] = jsvar(secret_options)
        self[:jsvars][:frontend_host] = jsvar(frontend_host)
        self[:jsvars][:authenticated] = jsvar(authenticated)
        self[:jsvars][:site_host] = jsvar(site[:host])
        self[:jsvars][:canonical_domain] = jsvar(canonical_domain)
        self[:jsvars][:domain_strategy] = jsvar(domain_strategy)
        self[:jsvars][:domain_id] = jsvar(domain_id)
        self[:jsvars][:domain_branding] = jsvar(domain_branding)
        self[:jsvars][:domain_logo] = jsvar(domain_logo)
        self[:jsvars][:display_domain] = jsvar(display_domain)

        self[:jsvars][:ot_version] = jsvar(OT::VERSION.inspect)
        self[:jsvars][:ruby_version] = jsvar("#{OT.sysinfo.vm}-#{OT.sysinfo.ruby.join}")

        self[:jsvars][:messages] = jsvar(self[:messages])

        plans = Onetime::Plan.plans.transform_values do |plan|
          plan.safe_dump
        end
        self[:jsvars][:available_plans] = jsvar(plans)

        @plan = Onetime::Plan.plan(cust.planid) unless cust.nil?
        @plan ||= Onetime::Plan.plan('anonymous')
        @is_paid = plan.paid?

        self[:jsvars][:plan] = jsvar(plan.safe_dump)
        self[:jsvars][:is_paid] = jsvar(@is_paid)
        self[:jsvars][:default_planid] = jsvar('basic')

        # So the list of template vars shows up sorted variable name
        # self[:jsvars] = self[:jsvars].sort
        self[:window] = self[:jsvars].to_json

        init(*args) if respond_to? :init
      end

      def i18n
        self.class.pagename ||= self.class.name.split('::').last.downcase.to_sym
        @i18n ||= {
          locale: self.locale,
          default: OT.conf[:locales].first.to_s,
          page: OT.locales[self.locale][:web][self.class.pagename],
          COMMON: OT.locales[self.locale][:web][:COMMON]
        }
      end

      # Add notification message to be displayed in StatusBar component
      # @param msg [String] message content to be displayed
      # @param type [String] type of message, one of: info, error, success (default: 'info')
      # @return [Array<Hash>] array containing message objects {type: String, content: String}
      def add_message msg, type='info'
        messages << {type: type, content: msg}
      end

      # Add error message to be displayed in StatusBar component
      # @param msg [String] error message content to be displayed
      # @return [Array<Hash>] array containing message objects {type: String, content: String}
      def add_error msg
        add_message(msg, 'error')
      end

      class << self
        # pagename must stay here while we use i18n method above. It populates
        # the i18n[:web][:pagename] hash with the locale translations, provided
        # the view being used has a matching name in the locales file.
        attr_accessor :pagename
      end

    end
  end
end
