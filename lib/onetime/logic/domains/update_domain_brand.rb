require_relative '../base'
require_relative '../../cluster'

module Onetime::Logic
  module Domains
    class UpdateDomainBrand < OT::Logic::Base
      attr_reader :greenlighted, :brand_settings, :display_domain, :custom_domain

      def process_params
        @domain_id = params[:domain].to_s.strip
        valid_keys = [
          :logo, # e.g. "image1"
          :primary_color,
          :instructions_pre_reveal,
          :instructions_reveal,
          :instructions_post_reveal,
          :button_text_light,
          :font_family,
          :corner_style,
          :allow_public_homepage,
          :allow_public_api,
        ]
        OT.ld "[UpdateDomainBrand] Settings #{params[:brand].keys} for #{@domain_id}"
        # Filter out invalid keys and convert keys to symbols
        @brand_settings = params[:brand]&.transform_keys(&:to_sym)&.slice(*valid_keys) || {}
      end

      # Validate the input parameters
      # Sets error messages if any parameter is invalid
      def raise_concerns
        OT.ld "[UpdateDomainBrand] Raising any concerns about domain_id: #{@domain_id}"

        raise_form_error "Please provide a domain ID" if @domain_id.nil? || @domain_id.empty?
        @custom_domain = OT::CustomDomain.load(@domain_id, @cust.custid)
        raise_form_error "Domain not found" unless custom_domain && custom_domain.exists?
        raise_form_error "Please provide brand settings" if @brand_settings.nil? || !@brand_settings.is_a?(Hash)

        limit_action :update_domain_brand

        if @brand_settings[:primary_color]
          raise_form_error "Invalid primary color" unless valid_color?(@brand_settings[:primary_color])
        end

        if @brand_settings[:font_family]
          raise_form_error "Invalid font family" unless valid_font_family?(@brand_settings[:font_family])
        end

        if @brand_settings[:corner_style]
          raise_form_error "Invalid button style" unless valid_corner_style?(@brand_settings[:corner_style])
        end
      end

      def process
        @greenlighted = true


        return error("Custom domain not found") unless @custom_domain

        update_brand_settings
      end

      def success_data
        {
          custid: @cust.custid,
          record: @custom_domain.safe_dump,
          details: {
            cluster: OT::Cluster::Features.cluster_safe_dump
          }
        }
      end

      # Update the brand settings for the custom domain
      # These keys are expected to match those listed in
      # src/types/onetime.d.ts for BrandSettings.
      def update_brand_settings
        current_brand = custom_domain.brand || {}

        # Step 1: Remove keys that are nil in the request
        brand_settings.each do |key, value|
          if value.nil?
            OT.ld "[UpdateDomainBrand] Removing brand setting: #{key}"
            current_brand.delete(key.to_s)
          end
        end

        # Step 2: Update remaining values
        brand_settings.each do |key, value| # rubocop:disable Style/CombinableLoops
          next if value.nil?
          OT.ld "[UpdateDomainBrand] Updating brand setting: #{key} => #{value} (#{value.class})"
          custom_domain.brand[key.to_s] = value.to_s # everything in redis is a string
        end

        custom_domain.updated = Time.now.to_i
        custom_domain.save
      end

      # Validate URL format
      def valid_url?(url)
        uri = URI.parse(url)
        uri.is_a?(URI::HTTP) || uri.is_a?(URI::HTTPS)
      rescue URI::InvalidURIError
        false
      end

      # Validate color format (hex code)
      def valid_color?(color)
        color.match?(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      end

      # Validate font family
      def valid_font_family?(font)
        %w[sans-serif serif monospace].include?(font)
      end

      # Validate button style
      def valid_corner_style?(style)
        %w[rounded square pill].include?(style)
      end
    end
  end
end
