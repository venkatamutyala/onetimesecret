/**
 * Description: Main entry point for the Vue application.
 */

// Ensures modulepreload works in all browsers, improving
// performance by preloading modules.
import 'vite/modulepreload-polyfill';

import i18n, { setLanguage } from '@/i18n';
import { ErrorHandlerPlugin } from '@/plugins';
import { logoutPlugin } from '@/plugins/pinia/logoutPlugin';
import { createAppRouter } from '@/router';
import { useAuthStore } from '@/stores/authStore';
import { useDomainsStore } from '@/stores/domainsStore';
import { useJurisdictionStore } from '@/stores/jurisdictionStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useMetadataStore } from '@/stores/metadataStore';
import { createApi } from '@/utils/api';
import { createPinia } from 'pinia';
import { createApp, watch } from 'vue';

import App from './App.vue';
import './assets/style.css';

/**
 * Initialize and mount the Vue application with proper language settings.
 *
 * The initialization process follows these steps:
 * 1. Create the Vue app instance and Pinia store.
 * 2. Determine the initial locale based on user preference or system settings.
 * 3. Set the application language before mounting.
 * 4. Update the language store for consistency.
 * 5. Apply plugins (i18n, router).
 * 6. Mount the application.
 *
 * This order ensures that:
 * - The correct language is available from the first render.
 * - User language preferences are respected.
 * - The language store is consistent with the actual app language.
 * - All components have access to the correct translations immediately.
 *
 * Using an async function allows us to wait for language loading
 * before mounting the app, preventing any flash of untranslated content.
 */
async function initializeApp() {
  // Create Vue app instance and Pinia store
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);

  // Add the global error handler early, before we can get ourselves in trouble
  app.use(ErrorHandlerPlugin, {
    debug: process.env.NODE_ENV === 'development',
  });

  pinia.use(logoutPlugin);

  const jurisdictionStore = useJurisdictionStore();

  // Initialize the store with the Regions config
  jurisdictionStore.init(window.regions);

  const authStore = useAuthStore();
  authStore.init();

  // Initialize language store
  const languageStore = useLanguageStore(); // TODO: navigator.language
  languageStore.init();
  const initialLocale = languageStore.getCurrentLocale;

  // Set language before mounting the app
  // This ensures correct translations are available for the initial render
  await setLanguage(initialLocale);

  // Update the store's currentLocale to ensure consistency
  languageStore.setCurrentLocale(initialLocale);

  // Add a watcher to react to language changes
  watch(
    () => languageStore.currentLocale,
    async (newLocale) => {
      if (newLocale) {
        // Type guard to ensure newLocale is not null
        console.debug('Language changed to:', newLocale);
        await setLanguage(newLocale);

        // Future considerations:
        // 1. API requests: Include language in request headers
        // axios.defaults.headers.common['Accept-Language'] = newLocale;

        // 2. SEO: Update URL to include language code
        // router.push(`/${newLocale}${router.currentRoute.value.path}`);

        // 3. SSR: If using SSR, ensure server-side logic is updated
        // This might involve server-side routing or state management
      }
    }
  );

  // Apply other plugins
  app.use(i18n);

  const router = createAppRouter();
  app.use(router);

  // Let the greater js world know that there's a new sheriff in town.
  window.enjoyTheVue = true;

  // Initialize the store with API instance
  const api = createApi();
  const metadataStore = useMetadataStore();
  metadataStore.setupErrorHandler(api);

  const domainsStore = useDomainsStore();
  domainsStore.setupErrorHandler(api);

  // Mount the application
  // This is done last to ensure all setup is complete before rendering
  app.mount('#app');
}

// Start the application initialization process
initializeApp();

// Created with http://patorjk.com/software/taag/#p=display&f=Tmplr&t=ONETIME
const notice = `
┏┓┳┓┏┓┏┳┓┳┳┳┓┏┓
┃┃┃┃┣  ┃ ┃┃┃┃┣
┗┛┛┗┗┛ ┻ ┻┛ ┗┗┛

`;

console.log(notice);
