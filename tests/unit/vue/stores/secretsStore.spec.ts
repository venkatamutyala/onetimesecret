// tests/unit/vue/stores/secretsStore.spec.ts
import { useSecretsStore } from '@/stores/secretsStore';
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { mockSecretRecord, mockSecretResponse } from '../fixtures/metadata';

describe('secretsStore', () => {
  let axiosMock: AxiosMockAdapter;
  let store: ReturnType<typeof useSecretsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    const axiosInstance = axios.create();
    axiosMock = new AxiosMockAdapter(axiosInstance);
    // Inject mocked axios instance into the store's API
    store = useSecretsStore();
    store.init(axiosInstance);
  });

  afterEach(() => {
    axiosMock.reset();
  });

  describe('Initialization', () => {
    it('initializes correctly', () => {
      expect(store.record).toBeNull();
      expect(store.details).toBeNull();
      expect(store.isLoading).toBe(false);
    });
  });

  describe('fetch', () => {
    it('debug response transformation', async () => {
      axiosMock.onGet('/api/v2/secret/abc123').reply(200, mockSecretResponse);

      // // Log the mock response
      // console.log('Mock Response:', JSON.stringify(mockSecretResponse, null, 2));

      await store.fetch('abc123');

      // // Log what's in the store
      // console.log('Store Record:', JSON.stringify(store.record, null, 2));

      // Test individual fields
      expect(store.record?.lifespan).toBe(mockSecretResponse.record.lifespan);
      // Other fields...
    });

    it('loads secret details successfully (everything except lifespan)', async () => {
      axiosMock.onGet('/api/v2/secret/abc123').reply(200, mockSecretResponse);

      await store.fetch('abc123');

      // Test everything except lifespan
      const { lifespan: _, ...recordWithoutLifespan } = store.record!;
      const { lifespan: __, ...expectedWithoutLifespan } = mockSecretResponse.record;

      expect(recordWithoutLifespan).toEqual(expectedWithoutLifespan);
      // Test that lifespan exists and is a string
      expect(typeof store.record?.lifespan).toBe('string');
      expect(store.details).toEqual(mockSecretResponse.details);
      expect(store.isLoading).toBe(false);
    });

    it('loads secret details successfully (original)', async () => {
      axiosMock.onGet('/api/v2/secret/abc123').reply(200, mockSecretResponse);

      await store.fetch('abc123');

      expect(store.record).toEqual(mockSecretResponse.record);
      expect(store.details).toEqual(mockSecretResponse.details);
      expect(store.isLoading).toBe(false);
      // add: expect error to be null
    });

    // Test the transformed values exactly (more brittle but more precise)
    it('loads secret details successfully (strict values)', async () => {
      axiosMock.onGet('/api/v2/secret/abc123').reply(200, mockSecretResponse);

      await store.fetch('abc123');

      const expectedRecord = {
        ...mockSecretResponse.record,
        lifespan: '24 hours', // Match exatly
      };

      expect(store.record).toEqual(expectedRecord);
      expect(store.details).toEqual(mockSecretResponse.details);
      expect(store.isLoading).toBe(false);
    });

    // Test for shape and types rather than exact values for transformed fields
    it('loads secret details successfully (looser values)', async () => {
      axiosMock.onGet('/api/v2/secret/abc123').reply(200, mockSecretResponse);

      await store.fetch('abc123');

      // Check record shape and transformed fields separately
      const { lifespan: _, ...recordWithoutLifespan } = store.record!;
      const { lifespan: __, ...expectedWithoutLifespan } = mockSecretResponse.record;

      expect(recordWithoutLifespan).toEqual(expectedWithoutLifespan);
      expect(typeof store.record?.lifespan).toBe('string');
      expect(store.record?.lifespan).toMatch(/\d+\s+\w+/); // Basic format check
      expect(store.details).toEqual(mockSecretResponse.details);
      expect(store.isLoading).toBe(false);
    });

    it('handles validation errors', async () => {
      axiosMock.onGet('/api/v2/secret/abc123').reply(200, { invalid: 'data' });

      await expect(store.fetch('abc123')).rejects.toThrow();
      // add: expect error to be raised
    });

    it('handles network errors', async () => {
      axiosMock.onGet('/api/v2/secret/abc123').networkError();

      await expect(store.fetch('abc123')).rejects.toThrow();
      expect(store.isLoading).toBe(false);
    });
  });

  describe('reveal', () => {
    it('reveals secret with passphrase', async () => {
      axiosMock.onPost('/api/v2/secret/abc123/reveal').reply(200, {
        success: true,
        record: {
          ...mockSecretRecord,
          secret_value: 'revealed secret',
        },
        details: {
          continue: false,
          show_secret: true,
          correct_passphrase: true,
          display_lines: 1,
          one_liner: true,
          is_owner: false, // Add required field
        },
      });

      await store.reveal('abc123', 'password');

      expect(store.record?.secret_value).toBe('revealed secret');
      expect(store.details?.show_secret).toBe(true);
      expect(store.isLoading).toBe(false);
    });

    it('preserves state on error', async () => {
      // Setup initial state
      axiosMock.onGet('/api/v2/secret/abc123').reply(200, mockSecretResponse);
      await store.fetch('abc123');
      const initialState = { record: store.record, details: store.details };

      // Force error on reveal
      axiosMock.onPost('/api/v2/secret/abc123/reveal').networkError();

      await expect(store.reveal('abc123', 'wrong')).rejects.toThrow();
      expect(store.record).toEqual(initialState.record);
      expect(store.details).toEqual(initialState.details);
    });
  });

  describe('clearSecret', () => {
    it('resets store state', async () => {
      axiosMock.onGet('/api/v2/secret/abc123').reply(200, mockSecretResponse);

      await store.fetch('abc123');
      store.clear();

      expect(store.record).toBeNull();
      expect(store.details).toBeNull();
      // add: expect error to be null
    });
  });

  describe('field handling', () => {
    describe('is_owner field', () => {
      it('handles is_owner true from API', async () => {
        const ownerResponse = {
          ...mockSecretResponse,
          details: {
            ...mockSecretResponse.details,
            is_owner: true,
          },
        };

        axiosMock.onGet('/api/v2/secret/abc123').reply(200, ownerResponse);
        await store.fetch('abc123');

        expect(store.details?.is_owner).toBe(true);
      });

      it('handles is_owner false from API', async () => {
        const nonOwnerResponse = {
          ...mockSecretResponse,
          details: {
            ...mockSecretResponse.details,
            is_owner: false,
          },
        };

        axiosMock.onGet('/api/v2/secret/abc123').reply(200, nonOwnerResponse);
        await store.fetch('abc123');

        expect(store.details?.is_owner).toBe(false);
      });

      it('handles missing is_owner field from API', async () => {
        const responseWithoutOwner = {
          ...mockSecretResponse,
          details: {
            ...mockSecretResponse.details,
            is_owner: undefined,
          },
        };

        axiosMock.onGet('/api/v2/secret/abc123').reply(200, responseWithoutOwner);
        await store.fetch('abc123');

        // Schema should default undefined to false
        expect(store.details?.is_owner).toBe(false);
      });
    });

    describe('lifespan field', () => {
      it('transforms TTL into human readable duration', async () => {
        const response = {
          ...mockSecretResponse,
          record: {
            ...mockSecretResponse.record,
            secret_ttl: 86400, // 24 hours in seconds
          },
        };

        axiosMock.onGet('/api/v2/secret/abc123').reply(200, response);
        await store.fetch('abc123');

        // Test that lifespan exists and follows expected format
        expect(store.record?.lifespan).toBeDefined();
        expect(typeof store.record?.lifespan).toBe('string');
        expect(store.record?.lifespan).toMatch(/\d+\s+(seconds?|minutes?|hours?|days?)/);
      });

      it('handles null TTL values', async () => {
        const response = {
          ...mockSecretResponse,
          record: {
            ...mockSecretResponse.record,
            secret_ttl: null,
            lifespan: null,
          },
        };

        axiosMock.onGet('/api/v2/secret/abc123').reply(200, response);
        await store.fetch('abc123');

        expect(store.record?.lifespan).toBeNull();
      });

      it('handles static lifespan from API', async () => {
        const staticLifespanResponse = {
          ...mockSecretResponse,
          record: {
            ...mockSecretResponse.record,
            lifespan: '24 hours',
          },
        };

        axiosMock.onGet('/api/v2/secret/abc123').reply(200, staticLifespanResponse);
        await store.fetch('abc123');

        expect(typeof store.record?.lifespan).toBe('string');
        expect(store.record?.lifespan).toMatch(/\d+\s+(seconds?|minutes?|hours?|days?)/);
      });

      it('handles null lifespan from API', async () => {
        const nullLifespanResponse = {
          ...mockSecretResponse,
          record: {
            ...mockSecretResponse.record,
            lifespan: null,
          },
        };

        axiosMock.onGet('/api/v2/secret/abc123').reply(200, nullLifespanResponse);
        await store.fetch('abc123');

        expect(store.record?.lifespan).toBeNull();
      });

      it('handles missing lifespan field from API', async () => {
        const responseWithoutLifespan = {
          ...mockSecretResponse,
          record: {
            ...mockSecretResponse.record,
            lifespan: undefined,
          },
        };

        axiosMock.onGet('/api/v2/secret/abc123').reply(200, responseWithoutLifespan);

        await expect(store.fetch('abc123')).rejects.toThrow();

        // Schema should handle undefined appropriately
        expect(store.record?.lifespan).toBeUndefined();
      });

      it('should fail if lifespan is undefined', async () => {
        const responseWithUndefinedLifespan = {
          ...mockSecretResponse,
          record: {
            ...mockSecretResponse.record,
            lifespan: undefined,
          },
        };

        axiosMock
          .onGet('/api/v2/secret/abc123')
          .reply(200, responseWithUndefinedLifespan);

        // Should fail validation since undefined is not allowed by schema
        await expect(store.fetch('abc123')).rejects.toThrow();

        // Store record should remain unchanged
        expect(store.record).toBeNull();
      });

      it('rejects undefined lifespan from API and keeps store unchanged', async () => {
        // Start with null store state
        expect(store.record).toBeNull();

        const responseWithUndefinedLifespan = {
          ...mockSecretResponse,
          record: {
            ...mockSecretResponse.record,
            lifespan: undefined,
          },
        };

        axiosMock
          .onGet('/api/v2/secret/abc123')
          .reply(200, responseWithUndefinedLifespan);

        // Should fail validation since schema requires string | null
        await expect(store.fetch('abc123')).rejects.toThrow();

        // Store should remain in initial state after failed validation
        expect(store.record).toBeNull();
      });
    });
  });
});
