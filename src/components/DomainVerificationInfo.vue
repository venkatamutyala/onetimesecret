<script setup lang="ts">
import { CustomDomain } from '@/schemas/models';
import OIcon from '@/components/icons/OIcon.vue';
import { useDomainStatus } from '@/composables/useDomainStatus';
//import StatusLabel from './StatusLabel.vue';
//import StatusLabelRow from './StatusLabelRow.vue';

interface Props {
  domain: CustomDomain;
  mode?: string;
}

const props = defineProps<Props>();

const { statusIcon, statusColor, isActive, isWarning, isError } = useDomainStatus(props.domain);

// const formatDate = (dateString: string): string => {
//   const date = new Date(dateString);
//   /**
//    * About Intl.DateTimeFormat:
//    *
//    *  - It automatically respects the user's locale settings.
//    *  - It handles internationalization correctly, using the appropriate
//    *      date format for the user's locale.
//    *  - It's more efficient than toLocaleDateString for repeated use, as
//    *      you can reuse the formatter.
//    */
//   return new Intl.DateTimeFormat(undefined, {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric'
//   }).format(date);
// };

</script>

<template>
  <div>
    <RouterLink v-if="mode === 'icon'"
                :to="`/domains/${domain?.display_domain}/verify`"
                class="tooltip inline-flex"
                data-tooltip="View domain verification status">
      <OIcon collection="mdi"
             :name="statusIcon"
             class="opacity-75"
             :class="[
          'size-5 transition-opacity hover:opacity-80',
          {
            'text-emerald-600 dark:text-emerald-400': isActive,
            'text-amber-500 dark:text-amber-400': isWarning,
            'text-rose-600 dark:text-rose-500': isError,
          }
        ]" />
    </RouterLink>
    <div v-else
         class="my-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <h2 class="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        Domain Status
      </h2>
      <div class="flex flex-col">
        <div v-if="domain?.vhost"
             class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex flex-col">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Domain</span>
            <span class="text-lg text-gray-900 dark:text-white">{{ domain?.vhost?.incoming_address }}</span>
          </div>

          <div class="flex flex-col">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
            <span :class="statusColor"
                  class="text-lg">{{ domain?.vhost?.status_message }}</span>
          </div>

          <div class="flex flex-col">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Target Address</span>
            <span class="text-lg text-gray-900 dark:text-white">{{ domain?.vhost?.target_address }}</span>
          </div>

          <div class="flex flex-col">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">DNS Record</span>
            <span class="text-lg text-gray-900 dark:text-white">{{ domain?.vhost?.dns_pointed_at }}</span>
          </div>

          <div class="flex flex-col">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">SSL Renews</span>
            <span class="text-lg text-gray-900 dark:text-white"><span
                    v-if="domain?.vhost.ssl_active_until">{{ domain?.vhost.ssl_active_until }}</span></span>
          </div>

          <div class="flex flex-col">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">SSL Status</span>
            <span class="text-lg"
                  :class="domain?.vhost?.has_ssl ? 'text-green-600' : 'text-red-600'">
              {{ domain?.vhost?.has_ssl ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="flex flex-col">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Last Monitored</span>
            <span class="text-lg text-gray-900 dark:text-white">{{ domain?.vhost?.last_monitored_humanized }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
