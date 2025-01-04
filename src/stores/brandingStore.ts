//
import { brandSettingschema } from '@/schemas/models/domain/brand';
import type { PiniaCustomProperties } from 'pinia';
import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Type definition for BrandingStore.
 */
export type BrandingStore = {
  // State
  primaryColor: string;
  _initialized: boolean;

  // Actions
  setPrimaryColor: (color: string) => void;
  $reset: () => void;
  init: () => void;
} & PiniaCustomProperties;

export const useBrandingStore = defineStore('branding', () => {
  const primaryColor = ref(brandSettingschema.shape.primary_color.parse(undefined));

  const _initialized = ref(false);

  function init(this: BrandingStore) {
    if (_initialized.value) return;
    _initialized.value = true;
  }

  function setPrimaryColor(this: BrandingStore, color: string) {
    primaryColor.value = brandSettingschema.shape.primary_color.parse(color);
  }

  function $reset(this: BrandingStore) {
    /* Reset primaryColor by passing undefined through primary_color field validator
     * This triggers Zod schema's default value if defined
     * schema.shape provides access to individual field validators
     * See https://zod.dev/ for schema parsing docs
     * See https://pinia.vuejs.org/core-concepts/state.html for Pinia state management
     */
    primaryColor.value = brandSettingschema.shape.primary_color.parse(undefined);
    _initialized.value = false;
  }

  return {
    init,
    primaryColor,
    setPrimaryColor,

    $reset,
  };
});
