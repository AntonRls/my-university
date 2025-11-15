const DEFAULT_TENANT_ID = '1';

function resolveEnvTenantId(): string | null {
  if (typeof import.meta === 'undefined') {
    return null;
  }

  const envValue = import.meta.env?.VITE_TENANT_ID;

  if (typeof envValue === 'string' && envValue.trim().length > 0) {
    return envValue;
  }

  return null;
}

export function getTenantId(): string {
  const fromEnv = resolveEnvTenantId();

  if (fromEnv) {
    return fromEnv;
  }

  return DEFAULT_TENANT_ID;
}

export function buildTenantHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'X-Tenant-Id': getTenantId(),
    ...(extra ?? {}),
  };
}


