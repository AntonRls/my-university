/// <reference types="vite/client" />

type ApiServiceName = 'tenant' | 'auth' | 'admin';

type RuntimeConfig = {
  tenantApiBaseUrl?: string;
  authApiBaseUrl?: string;
  adminApiBaseUrl?: string;
};

type ServiceDefaults = {
  dev: string;
  prod: string;
  envKeys: ReadonlyArray<string>;
};

const RUNTIME_CONFIG_KEY_MAP: Record<ApiServiceName, keyof RuntimeConfig> = {
  tenant: 'tenantApiBaseUrl',
  auth: 'authApiBaseUrl',
  admin: 'adminApiBaseUrl',
};

const SERVICE_DEFAULTS: Record<ApiServiceName, ServiceDefaults> = {
  tenant: {
    dev: 'https://linguabigben.ru',
    prod: 'https://linguabigben.ru',
    envKeys: ['VITE_TENANT_API_BASE_URL', 'VITE_API_BASE_URL'],
  },
  auth: {
    dev: 'https://linguabigben.ru:5051',
    prod: 'https://linguabigben.ru:5051',
    envKeys: ['VITE_AUTH_API_BASE_URL'],
  },
  admin: {
    dev: 'https://linguabigben.ru:5002',
    prod: 'https://linguabigben.ru:5002',
    envKeys: ['VITE_ADMIN_API_BASE_URL'],
  },
};

const TEMPLATE_VALUE_PATTERN = /^\$\{[A-Z0-9_]+\}$/i;

function isDevMode(): boolean {
  if (typeof import.meta === 'undefined') {
    return false;
  }

  return Boolean(import.meta.env?.DEV);
}

function normalizeBaseUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || TEMPLATE_VALUE_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function resolveRuntimeBaseUrl(service: ApiServiceName): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const runtimeConfig = window.__MY_UNIVERSITY_RUNTIME_CONFIG__;
  if (!runtimeConfig) {
    return null;
  }

  const runtimeValue = runtimeConfig[RUNTIME_CONFIG_KEY_MAP[service]];
  return normalizeBaseUrl(runtimeValue);
}

function resolveEnvBaseUrl(service: ApiServiceName): string | null {
  if (typeof import.meta === 'undefined' || typeof import.meta.env === 'undefined') {
    return null;
  }

  const envRecord = import.meta.env as Record<string, unknown>;
  const keys = SERVICE_DEFAULTS[service]?.envKeys ?? [];

  for (const key of keys) {
    const normalized = normalizeBaseUrl(envRecord[key]);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function getServiceBaseUrl(service: ApiServiceName): string {
  const runtimeValue = resolveRuntimeBaseUrl(service);
  if (runtimeValue) {
    return runtimeValue;
  }

  const envValue = resolveEnvBaseUrl(service);
  if (envValue) {
    return envValue;
  }

  const defaults = SERVICE_DEFAULTS[service];
  return isDevMode() ? defaults.dev : defaults.prod;
}

export function getTenantApiBaseUrl(): string {
  return getServiceBaseUrl('tenant');
}

export function getAuthApiBaseUrl(): string {
  return getServiceBaseUrl('auth');
}

export function getAdminApiBaseUrl(): string {
  return getServiceBaseUrl('admin');
}

// Backwards compatibility for modules that still import the legacy helper
export function getApiBaseUrl(): string {
  return getTenantApiBaseUrl();
}

declare global {
  interface Window {
    __MY_UNIVERSITY_RUNTIME_CONFIG__?: RuntimeConfig;
  }
}
