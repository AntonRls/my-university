import { atom } from 'jotai';
import type { Getter } from 'jotai';

import type { WebAppUser, Platform } from '@api/types';

/**
 * Данные пользователя из MAX Bridge
 */
export const userDataAtom = atom<WebAppUser | null>(null);

/**
 * Платформа, с которой запущено приложение
 */
export const platformAtom = atom<Platform | null>(null);

/**
 * Версия MAX
 */
export const versionAtom = atom<string | null>(null);

/**
 * Флаг доступности MAX Bridge
 */
export const isMaxBridgeAvailableAtom = atom<boolean>(false);

/**
 * Флаг инициализации данных пользователя
 */
export const isUserInitializedAtom = atom<boolean>(false);

/**
 * Производный атом: полное имя пользователя
 */
export const userFullNameAtom = atom((get: Getter) => {
  const user = get(userDataAtom);
  if (!user) return null;
  
  return `${user.first_name} ${user.last_name}`.trim();
});

/**
 * Производный атом: первая буква имени для аватара
 */
export const userInitialsAtom = atom((get: Getter) => {
  const user = get(userDataAtom);
  if (!user) return null;
  
  const firstInitial = user.first_name.charAt(0).toUpperCase();
  const lastInitial = user.last_name.charAt(0).toUpperCase();
  
  return `${firstInitial}${lastInitial}`;
});

/**
 * Производный атом: есть ли данные пользователя
 */
export const hasUserDataAtom = atom((get: Getter) => {
  const user = get(userDataAtom);
  return user !== null;
});

