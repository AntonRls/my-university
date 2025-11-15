import { STORAGE_KEYS, type StorageKey } from '@shared/constants/storage';

const isBrowser = typeof window !== 'undefined';
const storageKeys = Object.values(STORAGE_KEYS) as StorageKey[];

function isValidKey(key: string): key is StorageKey {
  return storageKeys.includes(key as StorageKey);
}

export async function setStorageItem(key: StorageKey, value: string): Promise<void> {
  if (!isBrowser) {
    return;
  }

  if (!isValidKey(key)) {
    console.warn(`[storage] Attempt to set unknown key "${key}"`);
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn('[storage] Failed to set item', error);
  }
}

export async function getStorageItem(key: StorageKey): Promise<string | null> {
  if (!isBrowser) {
    return null;
  }

  if (!isValidKey(key)) {
    console.warn(`[storage] Attempt to get unknown key "${key}"`);
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn('[storage] Failed to get item', error);
    return null;
  }
}

export async function removeStorageItem(key: StorageKey): Promise<void> {
  if (!isBrowser) {
    return;
  }

  if (!isValidKey(key)) {
    console.warn(`[storage] Attempt to remove unknown key "${key}"`);
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn('[storage] Failed to remove item', error);
  }
}

