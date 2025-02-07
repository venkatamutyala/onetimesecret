<script setup lang="ts">
import LoadingOverlay from '@/components/common/LoadingOverlay.vue';
import BrandSettingsBar from '@/components/dashboard/BrandSettingsBar.vue';
import BrowserPreviewFrame from '@/components/dashboard/BrowserPreviewFrame.vue';
import DomainHeader from '@/components/dashboard/DomainHeader.vue';
import InstructionsModal from '@/components/dashboard/InstructionsModal.vue';
import SecretPreview from '@/components/dashboard/SecretPreview.vue';
import OIcon from '@/components/icons/OIcon.vue';
import { useBranding } from '@/composables/useBranding';
import { createError } from '@/schemas/errors';
import { detectPlatform } from '@/utils';
import { computed, onMounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute } from 'vue-router';

const props = defineProps<{ domain: string }>();
const {
  isLoading,
  error,
  brandSettings,
  logoImage,
  primaryColor,
  hasUnsavedChanges,
  isInitialized,
  initialize,
  saveBranding,
  handleLogoUpload,
  removeLogo,
} = useBranding(props.domain);

const route = useRoute();
const displayDomain = computed(() => props.domain || route.params.domain as string);

const color = computed(() => primaryColor.value);
const browserType = ref<'safari' | 'edge'>(detectPlatform());

const toggleBrowser = () => {
  browserType.value = browserType.value === 'safari' ? 'edge' : 'safari';
};

// Add loading guard
watch(() => isLoading.value, (loading) => {
  if (!loading && !brandSettings.value) {
    error.value = createError('Failed to load brand settings', 'technical', 'error');
  }
});

onMounted(initialize);

onBeforeRouteLeave((to, from, next) => {
  if (hasUnsavedChanges.value) {
    const answer = window.confirm('You have unsaved changes. Are you sure?')
    if (answer) next()
    else next(false)
  } else {
    next()
  }
})
</script>

<template>

  <div>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">

      <!-- Header Section -->
      <div class="sticky top-0 z-30">
        <DomainHeader :display-domain="displayDomain" />

        <BrandSettingsBar
          v-model="brandSettings"
          :is-loading="isLoading"
          :is-initialized="isInitialized"
          @submit="() => saveBranding(brandSettings)">
          <template #instructions-button>
            <InstructionsModal
              v-model="brandSettings.instructions_pre_reveal"
              @update:model-value="(value) => brandSettings.instructions_pre_reveal = value"
            />
          </template>
        </BrandSettingsBar>
      </div>

      <!-- Main Content -->
      <div class="mx-auto max-w-7xl p-4 sm:px-6 sm:py-8 lg:px-8">
        <!-- Preview Section -->
        <div class="relative mb-6 sm:mb-12">
          <h2 id="previewHeading"
              class="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Preview & Customize
          </h2>

          <!-- Instructions for screen readers -->
          <div class="sr-only"
              role="note">
            This is an interactive preview of how recipients will see your secure messages. You can:
            - Customize colors and fonts using the controls above
            - Upload a logo (minimum 128x128 pixels recommended, 1MB max)
            - Test the preview using the "View Secret" button
          </div>

          <!-- Visual instructions -->
          <ul class="mb-4 space-y-1 text-sm sm:mb-6 sm:space-y-2"
              :aria-hidden="true">
            <li class="flex items-center gap-2">
              <OIcon collection="mdi"
              name="palette-outline"
                    class="size-5"
                    aria-label="Customization icon" />
              Use the controls above to customize brand color, styles, and recipient instructions
            </li>

            <li class="flex items-center gap-2">
              <OIcon collection="mdi"
              name="image-outline"
                    class="size-5"
                    aria-label="Image icon" />
              Click the preview image below to update your logo (minimum 128x128 pixels recommended, 1MB max)
            </li>

            <li class="flex items-center gap-2">
              <OIcon collection="mdi"
              name="eye-outline"
                    class="size-5"
                    aria-label="Eye icon" />
              Preview how recipients will see your secrets by testing the "View Secret" button
            </li>
          </ul>

          <BrowserPreviewFrame class="mx-auto w-full max-w-3xl overflow-hidden"
                              :domain="displayDomain"
                              :browser-type="browserType"
                              @toggle-browser="toggleBrowser"
                              aria-labelledby="previewHeading">
            <div class=" z-50 h-1 w-full"
                :style="{ backgroundColor: color }"></div>
            <SecretPreview v-if="!isLoading"
                          ref="secretPreview"
                          :domain-branding="brandSettings"
                          :logo-image="logoImage"
                          :on-logo-upload="handleLogoUpload"
                          :on-logo-remove="removeLogo"
                          secret-key="abcd"
                          class="max-w-full transition-all duration-200 hover:scale-[1.02]" />
          </BrowserPreviewFrame>

          <!-- Loading and Error States -->
          <div v-if="isLoading"
              role="status"
              class="py-8 text-center">
            <span class="sr-only">Loading preview...</span>
            <!-- Add isLoading spinner -->
          </div>

        </div>
      </div>

      <!-- Loading Overlay -->
      <LoadingOverlay :show="isLoading"
                      message="Loading brand settings" />
    </div>
  </div>
</template>
