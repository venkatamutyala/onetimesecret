// tests/unit/vue/setup.ts
/* global global */
import { autoInitPlugin } from '@/plugins/pinia/autoInitPlugin';
import { createApi } from '@/utils/api';
import { createI18n } from 'vue-i18n';
import { createTestingPinia } from '@pinia/testing';
import { vi } from 'vitest';
import { createApp, h } from 'vue';
import { stateFixture } from './fixtures/window.fixture';
import { mount } from '@vue/test-utils';
import type { ComponentPublicInstance } from 'vue';
import type { MountingOptions, VueWrapper } from '@vue/test-utils';
import type { OnetimeWindow } from '@/types/declarations/window';

// Mock global objects that JSDOM doesn't support
global.fetch = vi.fn();
global.Request = vi.fn();
global.Response = {
  error: vi.fn(),
  json: vi.fn(),
  redirect: vi.fn(),
  prototype: Response.prototype,
} as unknown as typeof Response;

window.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: query === '(prefers-color-scheme: dark)', // we start dark
  media: query,
  onchange: null,
  addListener: vi.fn(), // deprecated
  removeListener: vi.fn(), // deprecated
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

export function setupWindowState(state = stateFixture) {
  const originalState = window.__ONETIME_STATE__;
  window.__ONETIME_STATE__ = state;
  return () => {
    window.__ONETIME_STATE__ = originalState;
  };
}

export function createVueWrapper() {
  const app = createApp({
    render() {
      return h('div', [this.$slots.default?.()]);
    },
  });

  // Setup i18n with composition API mode
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {} },
  });

  app.use(i18n);

  return { app };
}

export async function setupTestPinia(options = { stubActions: false }) {
  const api = createApi();
  const { app } = createVueWrapper();

  const pinia = createTestingPinia({
    ...options,
    plugins: [autoInitPlugin({ api })],
  });

  app.use(pinia);
  // app.provide('api', api);

  // Wait for both microtasks and macrotasks to complete
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));

  return { pinia, api, app };
}

export async function mountComponent<
  C extends ComponentPublicInstance
>(
  component: any,
  options: MountingOptions<any> = {},
  state: OnetimeWindow = stateFixture
): Promise<VueWrapper<C>> {
  const revert = setupWindowState(state);
  try {
    const { pinia, api, app } = await setupTestPinia();
    return mount(component, {
      global: {
        plugins: [pinia],
        mocks: { api },
        ...(options.global || {}),
      },
      ...options,
    }) as VueWrapper<C>;
  } finally {
    revert();
  }
}
