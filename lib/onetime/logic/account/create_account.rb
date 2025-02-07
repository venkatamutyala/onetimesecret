

module Onetime::Logic
  module Account

    class CreateAccount < OT::Logic::Base
      attr_reader :cust, :plan, :autoverify, :customer_role
      attr_reader :planid, :custid, :password, :skill
      attr_accessor :token

      def process_params
        OT.ld "[CreateAccount#process_params] params: #{params.inspect}"
        @planid = params[:planid].to_s
        @custid = params[:u].to_s.downcase.strip

        @password = self.class.normalize_password(params[:p])

        autoverify_setting = OT.conf&.dig(:site, :authentication, :autoverify)
        @autoverify = autoverify_setting.to_s.eql?("true") || false

        # This is a hidden field, so it should be empty. If it has a value, it's
        # a simple bot trying to submit the form or similar chicanery. We just
        # quietly redirect to the home page to mimic a successful response.
        @skill = params[:skill].to_s.strip.slice(0,60)
      end

      def raise_concerns
        limit_action :create_account
        raise OT::FormError, "You're already signed up" if sess.authenticated?
        raise_form_error "Please try another email address" if OT::Customer.exists?(custid)
        raise_form_error "Is that a valid email address?" unless valid_email?(custid)
        raise_form_error "Password is too short" unless password.size >= 6

        unless OT::Plan.plan?(planid)
          @planid = 'basic'
        end

        # Quietly redirect suspected bots to the home page.
        unless skill.empty?
          raise OT::Redirect.new('/?s=1') # the query string is arbitrary, for log filtering
        end
      end

      def process

        @plan = OT::Plan.plan(planid)
        @cust = OT::Customer.create custid

        cust.update_passphrase password
        sess.custid = cust.custid
        sess.save

        @customer_role = if OT.conf[:colonels].member?(cust.custid)
                           'colonel'
                         else
                           'customer'
                         end

        cust.planid = @plan.planid
        cust.verified = @autoverify.to_s
        cust.role = @customer_role.to_s
        cust.save

        OT.info "[new-customer] #{cust.custid} #{cust.role} #{sess.ipaddress} #{plan.planid} #{sess.short_identifier}"
        OT::Logic.stathat_count("New Customers (OTS)", 1)


        success_message = if autoverify
          "Account created."
        else
          self.send_verification_email

          "#{i18n.dig(:web, :COMMON, :verification_sent_to)} #{cust.custid}."
        end

        sess.set_success_message success_message

      end

      private

      def form_fields
        { :planid => planid, :custid => custid }
      end
    end

  end
end
