<script setup lang="ts">
import AccountBillingSection from '@/components/account/AccountBillingSection.vue';
import AccountChangePasswordForm from '@/components/account/AccountChangePasswordForm.vue';
import AccountDeleteButtonWithModalForm from '@/components/account/AccountDeleteButtonWithModalForm.vue';
import APIKeyForm from '@/components/account/APIKeyForm.vue';
import DashboardTabNav from '@/components/dashboard/DashboardTabNav.vue';
import { WindowService } from '@/services/window.service';
import { onMounted } from 'vue';
import { useAccountStore } from '@/stores/accountStore';
import { storeToRefs } from 'pinia';

// Grabbing values from the window properties is a convenient way to get
// preformatted template variables (i.e. the jsvars from Onetime::App::View)
// rather than re-implement them here in Vue. We'll replace all of them
// eventually, but for now, this is a good way to keep momentum going.
const windowProps = WindowService.getMultiple({
  plan: null,
  cust: null,
  customer_since: null,
});


const accountStore = useAccountStore();
const { account } = storeToRefs(accountStore);

onMounted(accountStore.fetch);

</script>

<template>
  <div>
    <DashboardTabNav />

    <h1 class="mb-6 text-3xl font-bold dark:text-white">
      Your Account
    </h1>
    <p class="mb-4 text-lg dark:text-gray-300">
      Account type: {{ windowProps.plan?.options?.name }}
    </p>

    <!-- API KEY -->
    <div class="mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <h2 class="mb-4 flex items-center text-xl font-semibold dark:text-white">
        <i class="fas fa-exclamation-triangle mr-2 text-red-500"></i>
        <span class="flex-1">API Key</span>
      </h2>
      <div class="pl-3">
        <APIKeyForm :apitoken="account?.apitoken" />
      </div>
    </div>

    <!-- BILLING INFO -->
    <AccountBillingSection
      v-if="account && account.stripe_customer"
      :stripe-customer="account.stripe_customer"
      :stripe-subscriptions="account.stripe_subscriptions"
    />

    <!-- PASSWORD CHANGE -->
    <div class="mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <h2 class="mb-4 flex items-center text-xl font-semibold dark:text-white">
        <i class="fas fa-lock mr-2"></i> Update Password
      </h2>
      <div class="pl-3">
        <AccountChangePasswordForm />
      </div>
    </div>

    <div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <h2 class="mb-4 flex items-center text-xl font-semibold dark:text-white">
        <i class="fas fa-exclamation-triangle mr-2 text-red-500"></i>
        <span class="flex-1">Delete Account</span>
      </h2>
      <div class="pl-3">
        <!-- Added padding-left to align with the title text -->

        <!-- Ensure cust is not null or undefined before rendering the component -->
        <AccountDeleteButtonWithModalForm
          v-if="windowProps.cust"
          :cust="windowProps.cust"
        />
      </div>
    </div>

    <p class="mt-6 text-sm text-gray-600 dark:text-gray-400">
      Created {{ windowProps.cust?.secrets_created }} secrets since {{ windowProps.customer_since }}.
    </p>
  </div>
</template>
