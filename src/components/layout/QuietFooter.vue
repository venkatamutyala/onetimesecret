<!-- src/components/layout/DefaultFooter.vue -->

<script setup lang="ts">
import FooterLinkLists from '@/components/layout/FooterLinkLists.vue';
import FeedbackToggle from '@/components/FeedbackToggle.vue';
import JurisdictionFooterNotice from '@/components/JurisdictionFooterNotice.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
  import { useProductIdentity } from '@/stores/identityStore';;
  import type { LayoutProps } from '@/types/ui/layouts';
  import { WindowService } from '@/services/window.service';
  import { ref } from 'vue';

  const productIdentity = useProductIdentity();

  withDefaults(defineProps<LayoutProps>(), {

  });

  const windowProps = WindowService.getMultiple([
    'regions_enabled', 'regions', 'authentication'
  ]);

  const companyName = ref('OnetimeSecret.com');

</script>
<template>
  <footer
    class="w-full min-w-[320px] bg-gray-100 py-8 transition-colors duration-300 dark:bg-gray-800"
    aria-label="Site footer">
    <div
      v-if="productIdentity.isCanonical"
      class="container mx-auto max-w-2xl px-4">
      <FooterLinkLists v-if="displayLinks"
                       v-bind="$props" />

      <div class="
        mt-6 flex
        flex-col-reverse items-center
        justify-between
        space-y-6 space-y-reverse md:flex-row
        md:space-y-0">
        <div class="
          flex w-full
          flex-wrap items-center justify-center
          gap-4 text-center
          text-sm text-gray-500 dark:text-gray-400 md:w-auto md:justify-start md:text-left">
          <span v-if="displayVersion">
            &copy; {{ new Date().getFullYear() }} {{ companyName }}.
          </span>
        </div>

        <div v-if="displayToggles"
             class="
          flex w-full
          flex-wrap items-center justify-center
          space-x-4 md:w-auto
          md:justify-end">

          <JurisdictionFooterNotice v-if="windowProps.regions_enabled && windowProps.regions" />

          <ThemeToggle class="
            text-gray-500 transition-colors
            duration-200 hover:text-gray-800
            dark:text-gray-400 dark:hover:text-gray-100"
                       aria-label="Toggle dark mode" />

          <FeedbackToggle v-if="displayFeedback && windowProps.authentication?.enabled"
                          class="
            text-gray-500 transition-colors
            duration-200 hover:text-gray-800
            dark:text-gray-400 dark:hover:text-gray-100"
                          aria-label="Provide feedback" />
        </div>
      </div>
    </div>
    <div v-else
      class="container mx-auto max-w-2xl px-4">
      <div class="flex flex-col items-center justify-center space-y-4">
        <!-- Links Section -->
        <div class="text-sm text-gray-500 dark:text-gray-400">
          <router-link
            to="/info/terms"
            class="transition-colors duration-200 hover:text-gray-800 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
            Terms
          </router-link>
          <span
            class="mx-2 select-none"
            aria-hidden="true"
            >·</span
          >
          <router-link
            to="/info/privacy"
            class="transition-colors duration-200 hover:text-gray-800 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
            Privacy
          </router-link>
        </div>

        <!-- Theme Toggle -->
        <ThemeToggle
          v-if="displayToggles"
          class="text-gray-500 transition-colors duration-200 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
          aria-label="Toggle dark mode" />

      </div>
    </div>
  </footer>
</template>
