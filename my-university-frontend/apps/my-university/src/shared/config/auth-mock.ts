/* eslint-env browser */
/* eslint-disable no-console */

/**
 * Optional loader for local authorization mocks.
 *
 * To enable the mock in local development:
 * 1. Create `src/shared/config/local-auth.mock.ts` (ignored by git).
 * 2. Export a default object that contains either `queryParams` (string) or `payload` (object).
 *
 * Example:
 * ```
 * const payload = {
 *   auth_date: 1762888234,
 *   hash: '...',
 *   query_id: '...',
 *   user: {
 *     first_name: 'Сергей',
 *     last_name: 'Чернышёв',
 *     username: null,
 *     language_code: 'ru',
 *     photo_url: 'https://...',
 *     id: 97678977,
 *   },
 *   chat: { id: 32031148, type: 'DIALOG' },
 *   ip: '213.87.160.44',
 * };
 *
 * export default {
 *   enabled: true,
 *   payload,
 * };
 * ```
 */

type LocalAuthMockPayload = {
  ip?: string;
  chat?: Record<string, unknown>;
  hash: string;
  auth_date: number;
  query_id: string;
  user: Record<string, unknown>;
  [key: string]: unknown;
};

type LocalAuthMockConfig =
  | {
      enabled?: boolean;
      queryParams: string;
    }
  | {
      enabled?: boolean;
      payload: LocalAuthMockPayload;
    };

type LocalAuthMockModule = {
  default: LocalAuthMockConfig;
};

// Ленивая загрузка моков только в dev-режиме
// В production этот файл не должен загружаться
const mockModules = import.meta.glob<LocalAuthMockModule>('./local-auth.mock.ts', {
  eager: false,
});

let cachedQueryParams: string | null | undefined;

export function createQueryParamsFromPayload(payload: LocalAuthMockPayload): string {
  const params = new globalThis.URLSearchParams();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === 'object') {
      params.set(key, JSON.stringify(value));
    } else {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

export async function getLocalAuthMockQueryParams(): Promise<string | null> {
  if (cachedQueryParams !== undefined) {
    console.log('[Auth Mock] Using cached query params');
    return cachedQueryParams;
  }

  const isDevEnvironment = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
  const isDevMockDisabled =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_DISABLE_DEV_AUTH_MOCK === 'true';

  console.log('[Auth Mock] Dev environment:', isDevEnvironment);
  console.log('[Auth Mock] Mock disabled:', isDevMockDisabled);

  // КРИТИЧНО: В production моки не должны загружаться
  if (!isDevEnvironment || isDevMockDisabled) {
    console.log('[Auth Mock] Production mode or mock disabled - skipping mock load');
    cachedQueryParams = null;
    return cachedQueryParams;
  }

  const moduleLoader = mockModules['./local-auth.mock.ts'];
  
  if (!moduleLoader) {
    console.warn('[Auth Mock] ⚠️  No local-auth.mock.ts file found!');
    console.warn('[Auth Mock] Create src/shared/config/local-auth.mock.ts to enable mocks');
    console.warn('[Auth Mock] See local-auth.mock.example.ts for reference');
    cachedQueryParams = null;
    return cachedQueryParams;
  }

  let module: LocalAuthMockModule;
  try {
    module = await moduleLoader();
  } catch (error) {
    console.warn('[Auth Mock] Failed to load mock module:', error);
    cachedQueryParams = null;
    return cachedQueryParams;
  }

  console.log('[Auth Mock] Local mock file found:', !!module);

  const config = module.default;
  const enabled = config.enabled ?? true;

  console.log('[Auth Mock] Local mock enabled:', enabled);

  if (!enabled) {
    cachedQueryParams = null;
    return cachedQueryParams;
  }

  if ('queryParams' in config) {
    console.log('[Auth Mock] Using queryParams from local mock');
    cachedQueryParams = config.queryParams;
    return cachedQueryParams;
  }

  if ('payload' in config) {
    console.log('[Auth Mock] Using payload from local mock');
    cachedQueryParams = createQueryParamsFromPayload(config.payload);
    return cachedQueryParams;
  }

  cachedQueryParams = null;
  return cachedQueryParams;
}

export type { LocalAuthMockConfig, LocalAuthMockPayload };

