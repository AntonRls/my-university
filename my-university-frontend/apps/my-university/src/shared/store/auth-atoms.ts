import { atom } from 'jotai';
import type { Getter } from 'jotai';

export const authTokenAtom = atom<string | null>(null);

export const isAuthLoadingAtom = atom<boolean>(false);

export const isAuthInitializedAtom = atom<boolean>(false);

export const authErrorAtom = atom<string | null>(null);

export const isAuthorizedAtom = atom((get: Getter) => {
  return get(authTokenAtom) !== null;
});

