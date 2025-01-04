// src/stores/jurisdictionStore.ts

import { createError } from '@/composables/useAsyncHandler';
import type { Jurisdiction, RegionsConfig } from '@/schemas/models';
import { WindowService } from '@/services/window.service';
import type { PiniaCustomProperties } from 'pinia';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * N.B.
 * For the time being (i.e. for our first few locations), the region and
 * jurisdiction are the same. EU is EU, US is US. They will differentiate
 * once we get to for example, "California" is US and also California. The
 * reason we make the distinction is that there can be (and are) "layers"
 * of regulations and market forces involved. If I have a business in the
 * US, I probably would prefer to use a US data center given the choice
 * even if the business I'm in is not a regulated industry. I find it
 * helpful to think of it as "compliant by default".
 */

/**
 * Type definition for JurisdictionStore.
 */
type JurisdictionStore = {
  // State
  isLoading: boolean;
  enabled: boolean;
  currentJurisdiction: Jurisdiction | null;
  jurisdictions: Jurisdiction[];
  _initialized: boolean;

  // Getters
  getCurrentJurisdiction: Jurisdiction | null;
  getAllJurisdictions: Jurisdiction[];

  // Actions
  init: () => void;
  findJurisdiction: (identifier: string) => Jurisdiction;
  $reset: () => void;
} & PiniaCustomProperties;

/* eslint-disable max-lines-per-function */
export const useJurisdictionStore = defineStore('jurisdiction', () => {
  // State
  const isLoading = ref(false);
  const enabled = ref(false); // originally true
  const currentJurisdiction = ref<Jurisdiction | null>(null);
  const jurisdictions = ref<Jurisdiction[]>([]);
  const _initialized = ref(false);

  // Getters
  const getCurrentJurisdiction = computed(() => currentJurisdiction.value);
  const getAllJurisdictions = computed(() => jurisdictions.value);

  // Actions

  /**
   * Initialize the jurisdiction store with configuration from API
   * Handles both enabled and disabled region scenarios
   */
  function init(this: JurisdictionStore) {
    if (_initialized.value) return;
    let config: RegionsConfig | null;

    config = WindowService.get('regions', null);

    if (!config) {
      enabled.value = false;
      jurisdictions.value = [];
      currentJurisdiction.value = null;
      return;
    }

    enabled.value = config.enabled;
    jurisdictions.value = config.jurisdictions;

    const jurisdiction = this.findJurisdiction(config.current_jurisdiction);
    currentJurisdiction.value = jurisdiction;

    // If regions are disabled, ensure we only have the current jurisdiction
    if (!config.enabled) {
      jurisdictions.value = [jurisdiction];
    }

    _initialized.value = true;
  }

  /**
   * Find a jurisdiction by its identifier.
   * @throws ApiError if no jurisdiction is found with the given identifier.
   * @param identifier - The identifier of the jurisdiction to find.
   * @returns The found jurisdiction
   */
  function findJurisdiction(this: JurisdictionStore, identifier: string): Jurisdiction {
    const jurisdiction = jurisdictions.value.find((j) => j.identifier === identifier);

    if (!jurisdiction) {
      throw createError(`Jurisdiction "${identifier}" not found`, 'technical', 'error', {
        identifier,
      });
    }
    return jurisdiction;
  }

  /**
   * Reset store state to initial values
   */
  function $reset(this: JurisdictionStore) {
    isLoading.value = false;
    enabled.value = true;
    currentJurisdiction.value = null;
    jurisdictions.value = [];
    _initialized.value = false;
  }

  return {
    // State
    isLoading,
    enabled,
    currentJurisdiction,
    jurisdictions,

    // Getters
    getCurrentJurisdiction,
    getAllJurisdictions,

    // Actions
    init,
    findJurisdiction,
    $reset,
  };
});
