import { useAtomValue } from 'jotai';

import {
  userDataAtom,
  platformAtom,
  versionAtom,
  isMaxBridgeAvailableAtom,
  isUserInitializedAtom,
  userFullNameAtom,
  userInitialsAtom,
  hasUserDataAtom,
  authTokenAtom,
} from '@shared/store';
import { userService } from '@api/services';
import { getUserIdFromToken } from '@shared/utils/jwt';

/**
 * Хук для получения данных пользователя
 * Использует Jotai store
 */
export function useUser() {
  const user = useAtomValue(userDataAtom);
  const platform = useAtomValue(platformAtom);
  const version = useAtomValue(versionAtom);
  const isMaxBridgeAvailable = useAtomValue(isMaxBridgeAvailableAtom);
  const isInitialized = useAtomValue(isUserInitializedAtom);
  const hasUserData = useAtomValue(hasUserDataAtom);
  const fullName = useAtomValue(userFullNameAtom);
  const initials = useAtomValue(userInitialsAtom);

  return {
    user,
    platform,
    version,
    isMaxBridgeAvailable,
    isInitialized,
    hasUserData,
    fullName,
    initials,
    service: userService,
  };
}

/**
 * Хук для получения ID пользователя
 * Сначала пытается получить из MAX Bridge, если недоступно - из JWT токена
 */
export function useUserId() {
  const token = useAtomValue(authTokenAtom);
  const user = useAtomValue(userDataAtom);

  // JWT токен — единственный источник истины
  if (token) {
    const userIdFromToken = getUserIdFromToken(token);
    if (userIdFromToken !== null) {
      return userIdFromToken;
    }
  }

  if (user?.id) {
    return user.id;
  }

  return null;
}

/**
 * Хук для получения полного имени пользователя
 */
export function useUserFullName() {
  return useAtomValue(userFullNameAtom);
}

/**
 * Хук для получения инициалов пользователя
 */
export function useUserInitials() {
  return useAtomValue(userInitialsAtom);
}

/**
 * Хук для проверки наличия данных пользователя
 */
export function useHasUserData() {
  return useAtomValue(hasUserDataAtom);
}

/**
 * Хук для получения платформы
 */
export function usePlatform() {
  return useAtomValue(platformAtom);
}

/**
 * Хук для проверки доступности MAX Bridge
 */
export function useIsMaxBridgeAvailable() {
  return useAtomValue(isMaxBridgeAvailableAtom);
}

