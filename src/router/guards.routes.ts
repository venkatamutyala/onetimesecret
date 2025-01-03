// src/router/guards.ts

import { useValidatedWindowProp } from '@/composables/useWindowProps';
import { customerSchema } from '@/schemas/models';
import { useAuthStore } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { RouteLocationNormalized, Router } from 'vue-router';

export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to: RouteLocationNormalized) => {
    const authStore = useAuthStore();
    const languageStore = useLanguageStore();

    // Handle root path redirect for authenticated users
    if (to.path === '/') {
      if (authStore.isAuthenticated) {
        return { name: 'Dashboard' };
      }
      return true;
    }

    // Don't check auth for sign-in page to avoid redirect loops
    if (to.path === '/signin') {
      return true;
    }

    if (requiresAuthentication(to)) {
      // Only check if we need a fresh auth state
      if (authStore.needsCheck) {
        const isAuthenticated = await authStore.checkAuthStatus();
        if (!isAuthenticated) {
          return redirectToSignIn(to);
        }
      } else if (!authStore.isAuthenticated) {
        return redirectToSignIn(to);
      }

      // Proceed with navigation
      const userPreferences = await fetchCustomerPreferences();
      if (userPreferences.locale) {
        languageStore.setCurrentLocale(userPreferences.locale);
      }
    }
    return true; // Always return true for non-auth routes
  });
}

function requiresAuthentication(route: RouteLocationNormalized): boolean {
  return !!route.meta.requiresAuth;
}

function redirectToSignIn(from: RouteLocationNormalized) {
  return {
    path: '/signin',
    query: { redirect: from.fullPath },
  };
}

/**
 * Returns a dictionary of the customer's preferences.
 *
 * Currently the customer object is passed from backend on the initial
 * page load so there is no fetch happening. This implementation should
 * allow us to drop-in a request to the server when we need to.
 */
async function fetchCustomerPreferences(): Promise<{ locale?: string }> {
  const cust = useValidatedWindowProp('cust', customerSchema);
  return { locale: cust.value?.locale };
}
