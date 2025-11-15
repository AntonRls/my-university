import { getDefaultStore } from 'jotai';

import {
  userDataAtom,
  platformAtom,
  versionAtom,
  isMaxBridgeAvailableAtom,
  isUserInitializedAtom,
} from '@shared/store';
import { maxBridgeService } from './max-bridge-service';
import type { WebAppUser, Platform } from '@api/types';

/**
 * Сервис для управления данными пользователя
 * Синглтон, работает с глобальным стором Jotai
 */
class UserService {
  private readonly store = getDefaultStore();
  private readonly logPrefix = '[UserService]';

  /**
   * Инициализация данных пользователя из MAX Bridge
   */
  public init(): void {
    const isAvailable = maxBridgeService.isAvailable();
    this.store.set(isMaxBridgeAvailableAtom, isAvailable);

    if (isAvailable) {
      const user = maxBridgeService.getUserInfo();
      const platform = maxBridgeService.getPlatform();
      const version = maxBridgeService.getVersion();

      this.store.set(userDataAtom, user);
      this.store.set(platformAtom, platform);
      this.store.set(versionAtom, version);
      this.store.set(isUserInitializedAtom, true);

      console.warn(`${this.logPrefix} Initialized with user:`, user);
    } else {
      console.warn(`${this.logPrefix} MAX Bridge not available`);
      this.store.set(isUserInitializedAtom, true);
    }
  }

  /**
   * Получить данные пользователя
   */
  public getUserData(): WebAppUser | null {
    return this.store.get(userDataAtom);
  }

  /**
   * Установить данные пользователя (для тестирования или mock данных)
   */
  public setUserData(user: WebAppUser | null): void {
    console.warn(`${this.logPrefix} Setting user data:`, user);
    this.store.set(userDataAtom, user);
  }

  /**
   * Получить платформу
   */
  public getPlatform(): Platform | null {
    return this.store.get(platformAtom);
  }

  /**
   * Установить платформу
   */
  public setPlatform(platform: Platform | null): void {
    this.store.set(platformAtom, platform);
  }

  /**
   * Получить версию MAX
   */
  public getVersion(): string | null {
    return this.store.get(versionAtom);
  }

  /**
   * Проверка, доступен ли MAX Bridge
   */
  public isMaxBridgeAvailable(): boolean {
    return this.store.get(isMaxBridgeAvailableAtom);
  }

  /**
   * Проверка, инициализирован ли сервис
   */
  public isInitialized(): boolean {
    return this.store.get(isUserInitializedAtom);
  }

  /**
   * Проверка, есть ли данные пользователя
   */
  public hasUserData(): boolean {
    return this.getUserData() !== null;
  }

  /**
   * Получить ID пользователя
   */
  public getUserId(): number | null {
    const user = this.getUserData();
    return user?.id || null;
  }

  /**
   * Получить имя пользователя
   */
  public getUserName(): string | null {
    const user = this.getUserData();
    if (!user) return null;
    return `${user.first_name} ${user.last_name}`.trim();
  }

  /**
   * Получить username (@username)
   */
  public getUsername(): string | null {
    const user = this.getUserData();
    return user?.username || null;
  }

  /**
   * Получить язык пользователя
   */
  public getLanguage(): string | null {
    const user = this.getUserData();
    return user?.language_code || null;
  }

  /**
   * Получить URL фото пользователя
   */
  public getPhotoUrl(): string | null {
    const user = this.getUserData();
    return user?.photo_url || null;
  }

  /**
   * Очистить данные пользователя (для logout)
   */
  public clear(): void {
    console.warn(`${this.logPrefix} Clearing user data`);
    this.store.set(userDataAtom, null);
    this.store.set(platformAtom, null);
    this.store.set(versionAtom, null);
    this.store.set(isUserInitializedAtom, false);
  }

  /**
   * Обновить данные пользователя из MAX Bridge
   */
  public refresh(): void {
    console.warn(`${this.logPrefix} Refreshing user data`);
    this.init();
  }

  /**
   * Получить все данные для отладки
   */
  public getDebugInfo() {
    return {
      isAvailable: this.isMaxBridgeAvailable(),
      isInitialized: this.isInitialized(),
      hasUserData: this.hasUserData(),
      user: this.getUserData(),
      platform: this.getPlatform(),
      version: this.getVersion(),
    };
  }
}

// Экспортируем синглтон
export const userService = new UserService();

