import { useAtomValue } from 'jotai';

import {
  authTokenAtom,
  isAuthLoadingAtom,
  isAuthInitializedAtom,
  authErrorAtom,
  isAuthorizedAtom,
} from '@shared/store';

export function useAuth() {
  const token = useAtomValue(authTokenAtom);
  const isLoading = useAtomValue(isAuthLoadingAtom);
  const isInitialized = useAtomValue(isAuthInitializedAtom);
  const error = useAtomValue(authErrorAtom);
  const isAuthorized = useAtomValue(isAuthorizedAtom);

  return {
    token,
    isLoading,
    isInitialized,
    error,
    isAuthorized,
  };
}

