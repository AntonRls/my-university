/* eslint-disable no-console */

import { getDefaultStore } from 'jotai';

import { ApiError, apiPost, configureAuthTokenProvider } from '@api/shared/api/api-client';
import { getAuthApiBaseUrl } from '@api/shared/api/config';
import { getLocalAuthMockQueryParams } from '@shared/config/auth-mock';
import { STORAGE_KEYS } from '@shared/constants/storage';
import {
  authTokenAtom,
  isAuthLoadingAtom,
  isAuthInitializedAtom,
  authErrorAtom,
} from '@shared/store';
import { getCookie, removeCookie, setCookie } from '@shared/utils/cookies';

import { maxBridgeService } from './max-bridge-service';

type AccessTokenResponse = {
  access_token: string | null;
};

type GetUserTokenPayload = {
  query_params: string;
};

const SERVER_UNAVAILABLE_MESSAGE =
  'Сервис авторизации недоступен. Пожалуйста, попробуйте позже — мы уже решаем проблему.';

function resolveAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status >= 500) {
    return SERVER_UNAVAILABLE_MESSAGE;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Не удалось выполнить авторизацию пользователя';
}

class AuthService {
  private readonly store = getDefaultStore();

  private readonly logPrefix = '[AuthService]';

  private readonly tokenCookieOptions = {
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax' as const,
    secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : false,
  };

  constructor() {
    configureAuthTokenProvider(() => {
      const token = this.store.get(authTokenAtom);

      if (token) {
        return token;
      }

      const cookieToken = getCookie(STORAGE_KEYS.ACCESS_TOKEN);

      if (cookieToken) {
        return cookieToken;
      }

      if (typeof import.meta !== 'undefined') {
        const envToken = import.meta.env?.VITE_DEFAULT_AUTH_TOKEN;
        if (typeof envToken === 'string' && envToken.length > 0) {
          return envToken;
        }
      }

      return null;
    });
  }

  public async init(): Promise<void> {
    const isLoading = this.store.get(isAuthLoadingAtom);

    if (isLoading) {
      return;
    }

    this.store.set(isAuthLoadingAtom, true);
    this.store.set(authErrorAtom, null);

    try {
      const token = await this.authenticate();

      this.store.set(authTokenAtom, token);
      setCookie(STORAGE_KEYS.ACCESS_TOKEN, token, this.tokenCookieOptions);

      console.info(`${this.logPrefix} Authorization succeeded`);
    } catch (error: unknown) {
      const fallbackToken = getCookie(STORAGE_KEYS.ACCESS_TOKEN);
      const message = resolveAuthErrorMessage(error);

      if (fallbackToken) {
        console.warn(`${this.logPrefix} Using token from cookies due to error: ${message}`);
        this.store.set(authTokenAtom, fallbackToken);
      } else {
        console.error(`${this.logPrefix} Authorization failed`, error);
        this.store.set(authTokenAtom, null);
        this.store.set(authErrorAtom, message);
      }
    } finally {
      this.store.set(isAuthLoadingAtom, false);
      this.store.set(isAuthInitializedAtom, true);
    }
  }

  public getAccessToken(): string | null {
    return this.store.get(authTokenAtom);
  }

  public async logout(): Promise<void> {
    removeCookie(STORAGE_KEYS.ACCESS_TOKEN, {
      path: this.tokenCookieOptions.path,
      sameSite: this.tokenCookieOptions.sameSite,
      secure: this.tokenCookieOptions.secure,
    });
    this.store.set(authTokenAtom, null);
    this.store.set(authErrorAtom, null);
    this.store.set(isAuthInitializedAtom, true);
  }

  private async authenticate(): Promise<string> {
    const queryParams = await this.resolveQueryParams();

    if (!queryParams) {
      throw new Error('Не удалось получить данные авторизации из WebApp или окружения');
    }

    const response = await apiPost<AccessTokenResponse, GetUserTokenPayload>(
      '/auth',
      { query_params: queryParams },
      {
        skipAuth: true,
        baseUrl: getAuthApiBaseUrl(),
      },
    );

    if (!response.access_token) {
      throw new Error('Сервис авторизации вернул пустой токен');
    }

    return response.access_token;
  }

  private async resolveQueryParams(): Promise<string | null> {
    const localMockParams = await getLocalAuthMockQueryParams();

    if (localMockParams) {
      return localMockParams;
    }

    const webApp = maxBridgeService.getWebApp();

    if (webApp?.initData) {
      return webApp.initData;
    }

    if (typeof window !== 'undefined' && window.location.search.length > 1) {
      return window.location.search.slice(1);
    }

    if (typeof import.meta !== 'undefined') {
      const fallback = import.meta.env?.VITE_MAX_QUERY_PARAMS;
      if (typeof fallback === 'string' && fallback.length > 0) {
        return fallback;
      }
    }

    return null;
  }
}

export const authService = new AuthService();

