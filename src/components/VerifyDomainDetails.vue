<script setup lang="ts">
import { useDomainsManager } from '@/composables/useDomainsManager';
import { CustomDomainResponse } from '@/schemas/api/responses';
import { CustomDomain, CustomDomainCluster } from '@/schemas/models/domain';
import OIcon from '@/components/icons/OIcon.vue';
import { computed, ref } from 'vue';

import BasicFormAlerts from './BasicFormAlerts.vue';
import DetailField from './DetailField.vue';

interface Props {
  domain: CustomDomain;
  cluster?: CustomDomainCluster | null;
  withVerifyCTA?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  domain: () => ({} as CustomDomain),
  cluster: null,
  withVerifyCTA: false,
});

// Define the emit function with the type
const emit = defineEmits<{
  (e: 'domainVerify', data: CustomDomainResponse): void;
}>();

const { verifyDomain, isLoading, error } = useDomainsManager();

const success = ref<string | null>(null);
const buttonDisabledDelay = ref(false);
const isButtonDisabled = computed(() => isLoading.value || buttonDisabledDelay.value);

const verify = async () => {
  console.info('Refreshing DNS verification details...');

  try {
    const result = await verifyDomain(props.domain.display_domain);
    if (result) {
      success.value = "Domain verification initiated successfully."
      emit('domainVerify', result);

      buttonDisabledDelay.value = true;
    }

    setTimeout(() => {
      buttonDisabledDelay.value = false;
    }, 3000);
  } catch (err) {
    console.error('Verification failed:', err);
  }
};
</script>

<template>
  <div class="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
    <h2 class="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
      Domain Verification Steps
    </h2>
    <p class="mb-6 text-lg text-gray-600 dark:text-gray-300">
      Follow these steps to verify domain ownership and elevate
      your online presence:
    </p>

    <BasicFormAlerts
      :success="success"
      :error="error"
    />

    <div class="mb-4 flex justify-end">
      <button
        v-if="withVerifyCTA"
        @click="verify"
        :disabled="isButtonDisabled"
        class="flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3
          text-lg font-semibold
          text-white transition
          duration-100
          ease-in-out hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-gray-400">
        <span>{{ isLoading ? 'Verifying...' : 'Verify Domain' }}</span>
        <OIcon
          collection="mdi"
          :name="isLoading ? 'loading' : 'check-circle'"
          class="size-5"
          :class="{ 'animate-spin': isLoading }"
          aria-hidden="true"
        />
      </button>
    </div>


    <ol class="mb-8 space-y-6">
      <li class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
        <h3 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
          1. Create a TXT record
        </h3>
        <p class="mb-2 text-gray-600 dark:text-gray-300">
          Add this hostname to your DNS configuration:
        </p>

        <div class="space-y-2">
          <DetailField
            label="Type"
            value="TXT"
          />
          <DetailField
            label="Host"
            :value="domain.txt_validation_host"
            :appendix="`.${domain.base_domain}`"
          />
          <DetailField
            label="Value"
            :value="domain.txt_validation_value"
          />
        </div>
      </li>
      <li
        v-if="domain?.is_apex"
        class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
        <h3 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
          2. Create the A record
        </h3>

        <div class="space-y-2">
          <DetailField
            label="Type"
            value="A"
          />
          <DetailField
            label="Host"
            :value="domain?.trd ? domain.trd : '@'"
            :appendix="`.${domain?.base_domain}`"
          />
          <DetailField
            label="Value"
            :value="cluster?.cluster_ip ?? ''"
          />
        </div>
      </li>
      <li
        v-else
        class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
        <h3 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
          2. Create the CNAME record
        </h3>

        <div class="space-y-2">
          <DetailField
            v-if="domain?.is_apex"
            label="Type"
            value="A"
          />
          <DetailField
            v-else
            label="Type"
            value="CNAME"
          />

          <DetailField
            label="Host"
            :value="domain?.trd ? domain.trd : '@'"
            :appendix="`.${domain?.base_domain}`"
          />
          <DetailField
            v-if="domain?.is_apex"
            label="Value"
            :value="cluster?.cluster_ip ?? ''"
          />
          <DetailField
            v-else
            label="Value"
            :value="cluster?.cluster_host ?? ''"
          />
        </div>
      </li>
      <li class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
        <h3 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
          3. Wait for propagation
        </h3>
        <p class="text-gray-600 dark:text-gray-300">
          DNS changes can take as little as 60 seconds -- or up to 24 hours --
          to take effect.
        </p>
      </li>
    </ol>

    <div class="mt-5 flex items-start rounded-md bg-white p-4 dark:bg-gray-800">
      <OIcon
        collection="mdi"
        name="information-outline"
        class="mr-2 mt-0.5 size-5 shrink-0 text-brandcomp-700"
        aria-hidden="true"
      />
      <p class="text-sm text-gray-500 dark:text-gray-400">
        It may take a few minutes for your SSL certificate to take effect.
      </p>
    </div>
  </div>
</template>
