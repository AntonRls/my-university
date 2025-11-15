export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth.access_token',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

