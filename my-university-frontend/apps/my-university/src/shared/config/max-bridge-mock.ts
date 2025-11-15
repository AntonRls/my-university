/* eslint-disable no-console */
/* eslint-env browser */

import type { WebApp, WebAppData, ImpactStyle, NotificationType, ShareStatus } from '@api/types';

import { getLocalAuthMockQueryParams } from './auth-mock';

/**
 * Создает мок WebApp для локальной разработки.
 * Парсит query_params из auth-mock и эмулирует полный MAX Bridge API.
 * 
 * ВАЖНО: Работает только в dev-режиме (import.meta.env.DEV === true).
 * В production всегда используется реальный window.WebApp от MAX.
 */
export async function initMaxBridgeMock(): Promise<void> {
  console.group('[MAX Bridge Mock] Initialization');
  
  const isDevEnvironment = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
  const isMockDisabled =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_DISABLE_DEV_AUTH_MOCK === 'true';

  console.log('Dev environment:', isDevEnvironment);
  console.log('Mock disabled:', isMockDisabled);

  if (!isDevEnvironment || isMockDisabled) {
    console.log('❌ Mock disabled or not in dev mode');
    console.groupEnd();
    return;
  }

  if (typeof window === 'undefined') {
    console.log('❌ Window not available');
    console.groupEnd();
    return;
  }

  if (window.WebApp) {
    console.log('✅ Real WebApp detected, skipping mock');
    console.groupEnd();
    return;
  }

  const queryParams = await getLocalAuthMockQueryParams();
  console.log('Query params length:', queryParams?.length || 0);

  if (!queryParams) {
    console.warn('❌ No mock data available');
    console.groupEnd();
    return;
  }

  const parsedData = parseQueryParams(queryParams);

  if (!parsedData) {
    console.error('❌ Failed to parse query params');
    console.groupEnd();
    return;
  }

  window.WebApp = createMockWebApp(queryParams, parsedData);

  console.log('✅ Mock WebApp created successfully!');
  console.log('User:', parsedData.user);
  console.log('Chat:', parsedData.chat);
  console.log('Platform: web');
  
  console.groupEnd();
}

function parseQueryParams(queryString: string): WebAppData | null {
  try {
    console.log('[MAX Bridge Mock] Parsing query string:', queryString.substring(0, 100) + '...');
    
    const params = new URLSearchParams(queryString);

    const authDate = params.get('auth_date');
    const hash = params.get('hash');
    const queryId = params.get('query_id');
    const userJson = params.get('user');
    const chatJson = params.get('chat');

    console.log('[MAX Bridge Mock] Parsed params:', {
      authDate: authDate ? 'present' : 'missing',
      hash: hash ? hash.substring(0, 10) + '...' : 'missing',
      queryId: queryId ? 'present' : 'missing',
      userJson: userJson ? 'present' : 'missing',
      chatJson: chatJson ? 'present' : 'missing',
    });

    if (!authDate || !hash) {
      console.error('[MAX Bridge Mock] Missing required fields: auth_date or hash');
      return null;
    }

    const data: WebAppData = {
      query_id: queryId || '',
      auth_date: Number.parseInt(authDate, 10),
      hash,
    };

    if (userJson) {
      try {
        data.user = JSON.parse(userJson);
        console.log('[MAX Bridge Mock] User parsed:', data.user);
      } catch (e) {
        console.error('[MAX Bridge Mock] Failed to parse user JSON:', e);
      }
    }

    if (chatJson) {
      try {
        data.chat = JSON.parse(chatJson);
        console.log('[MAX Bridge Mock] Chat parsed:', data.chat);
      } catch (e) {
        console.error('[MAX Bridge Mock] Failed to parse chat JSON:', e);
      }
    }

    return data;
  } catch (error) {
    console.error('[MAX Bridge Mock] Parse error:', error);
    return null;
  }
}

function createMockWebApp(initData: string, initDataUnsafe: WebAppData): WebApp {
  return {
    initData,
    initDataUnsafe,
    platform: 'web',
    version: '8.0',

    onEvent: () => {
      /* mock */
    },
    offEvent: () => {
      /* mock */
    },

    ready: () => {
      console.log('[MAX Bridge Mock] ready() called');
    },

    close: () => {
      console.log('[MAX Bridge Mock] close() called');
    },

    requestContact: async () => {
      console.log('[MAX Bridge Mock] requestContact() called');
      return { phone: '+79991234567' };
    },

    BackButton: {
      isVisible: false,
      show: () => {
        console.log('[MAX Bridge Mock] BackButton.show()');
      },
      hide: () => {
        console.log('[MAX Bridge Mock] BackButton.hide()');
      },
      onClick: () => {
        /* mock */
      },
      offClick: () => {
        /* mock */
      },
    },

    ScreenCapture: {
      isScreenCaptureEnabled: false,
      enableScreenCapture: () => {
        console.log('[MAX Bridge Mock] ScreenCapture.enableScreenCapture()');
      },
      disableScreenCapture: () => {
        console.log('[MAX Bridge Mock] ScreenCapture.disableScreenCapture()');
      },
    },

    HapticFeedback: {
      impactOccurred: (style: ImpactStyle) => {
        console.log('[MAX Bridge Mock] HapticFeedback.impactOccurred:', style);
      },
      notificationOccurred: (type: NotificationType) => {
        console.log('[MAX Bridge Mock] HapticFeedback.notificationOccurred:', type);
      },
      selectionChanged: () => {
        console.log('[MAX Bridge Mock] HapticFeedback.selectionChanged()');
      },
    },

    enableClosingConfirmation: () => {
      console.log('[MAX Bridge Mock] enableClosingConfirmation()');
    },

    disableClosingConfirmation: () => {
      console.log('[MAX Bridge Mock] disableClosingConfirmation()');
    },

    openLink: (url: string) => {
      console.log('[MAX Bridge Mock] openLink:', url);
      window.open(url, '_blank');
    },

    openMaxLink: (url: string) => {
      console.log('[MAX Bridge Mock] openMaxLink:', url);
    },

    shareContent: async (text: string, link: string) => {
      console.log('[MAX Bridge Mock] shareContent:', { text, link });
      return { status: 'shared' as ShareStatus };
    },

    shareMaxContent: async (text: string, link: string) => {
      console.log('[MAX Bridge Mock] shareMaxContent:', { text, link });
      return { status: 'shared' as ShareStatus };
    },

    downloadFile: async (url: string, fileName: string) => {
      console.log('[MAX Bridge Mock] downloadFile:', { url, fileName });
    },

    openCodeReader: async () => {
      console.log('[MAX Bridge Mock] openCodeReader()');
      return { value: 'mock-qr-code' };
    },

    DeviceStorage: {
      setItem: async (key: string, value: string) => {
        console.log('[MAX Bridge Mock] DeviceStorage.setItem:', key);
        localStorage.setItem(`mock_storage_${key}`, value);
      },
      getItem: async (key: string) => {
        console.log('[MAX Bridge Mock] DeviceStorage.getItem:', key);
        return localStorage.getItem(`mock_storage_${key}`);
      },
      removeItem: async (key: string) => {
        console.log('[MAX Bridge Mock] DeviceStorage.removeItem:', key);
        localStorage.removeItem(`mock_storage_${key}`);
      },
      clear: async () => {
        console.log('[MAX Bridge Mock] DeviceStorage.clear()');
        Object.keys(localStorage)
          .filter((k) => k.startsWith('mock_storage_'))
          .forEach((k) => localStorage.removeItem(k));
      },
    },

    SecureStorage: {
      setItem: async (key: string, value: string) => {
        console.log('[MAX Bridge Mock] SecureStorage.setItem:', key);
        localStorage.setItem(`mock_secure_${key}`, value);
      },
      getItem: async (key: string) => {
        console.log('[MAX Bridge Mock] SecureStorage.getItem:', key);
        return localStorage.getItem(`mock_secure_${key}`);
      },
      removeItem: async (key: string) => {
        console.log('[MAX Bridge Mock] SecureStorage.removeItem:', key);
        localStorage.removeItem(`mock_secure_${key}`);
      },
    },

    BiometricManager: {
      isInited: false,
      isBiometricAvailable: false,
      biometricType: [],
      deviceId: null,
      isAccessRequested: false,
      isAccessGranted: false,
      isBiometricTokenSaved: false,

      init: async () => {
        console.log('[MAX Bridge Mock] BiometricManager.init()');
      },

      requestAccess: async () => {
        console.log('[MAX Bridge Mock] BiometricManager.requestAccess()');
        return false;
      },

      authenticate: async () => {
        console.log('[MAX Bridge Mock] BiometricManager.authenticate()');
        return false;
      },

      updateBiometricToken: async (token: string) => {
        console.log('[MAX Bridge Mock] BiometricManager.updateBiometricToken:', token);
      },

      openSettings: () => {
        console.log('[MAX Bridge Mock] BiometricManager.openSettings()');
      },
    },
  };
}

