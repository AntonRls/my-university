/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_AUTH_TOKEN?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AUTH_API_BASE_URL?: string;
  readonly VITE_ADMIN_API_BASE_URL?: string;
  readonly VITE_TENANT_API_BASE_URL?: string;
  readonly VITE_MAX_QUERY_PARAMS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
