/* eslint-disable no-console */
import type {
  WebApp,
  WebAppEventType,
  WebAppEventCallback,
  ImpactStyle,
  NotificationType,
  ShareStatus,
} from '@api/types';

/**
 * Сервис для работы с MAX Bridge API
 * Предоставляет типобезопасную обертку над window.WebApp
 * Логирует все события и вызовы методов
 */
class MaxBridgeService {
  private webApp: WebApp | null = null;
  private readonly logPrefix = '[MAX Bridge]';

  /**
   * Инициализация сервиса
   * Проверяет доступность WebApp и выводит информацию о пользователе
   */
  public init(): void {
    if (typeof window === 'undefined') {
      console.warn(`${this.logPrefix} Window is not defined (SSR environment)`);
      return;
    }

    if (!window.WebApp) {
      console.warn(
        `${this.logPrefix} WebApp is not available. Make sure max-web-app.js is loaded.`
      );
      return;
    }

    this.webApp = window.WebApp;

    console.group(`${this.logPrefix} Initialized`);
    console.log('Platform:', this.webApp.platform);
    console.log('Version:', this.webApp.version);
    console.log('Init Data:', this.webApp.initData);
    console.log('Init Data Unsafe:', this.webApp.initDataUnsafe);

    if (this.webApp.initDataUnsafe.user) {
      console.group('User Info:');
      console.log('ID:', this.webApp.initDataUnsafe.user.id);
      console.log('Name:', this.webApp.initDataUnsafe.user.first_name, this.webApp.initDataUnsafe.user.last_name);
      console.log('Username:', this.webApp.initDataUnsafe.user.username);
      console.log('Language:', this.webApp.initDataUnsafe.user.language_code);
      console.log('Photo URL:', this.webApp.initDataUnsafe.user.photo_url);
      console.groupEnd();
    }

    if (this.webApp.initDataUnsafe.chat) {
      console.group('Chat Info:');
      console.log('ID:', this.webApp.initDataUnsafe.chat.id);
      console.log('Type:', this.webApp.initDataUnsafe.chat.type);
      console.groupEnd();
    }

    console.groupEnd();

    this.setupEventListeners();
  }

  /**
   * Проверка доступности WebApp
   */
  public isAvailable(): boolean {
    return this.webApp !== null;
  }

  /**
   * Получить экземпляр WebApp (для прямого доступа если нужно)
   */
  public getWebApp(): WebApp | null {
    return this.webApp;
  }

  /**
   * Получить информацию о пользователе
   */
  public getUserInfo() {
    if (!this.webApp) {
      console.warn(`${this.logPrefix} WebApp is not available`);
      return null;
    }

    return this.webApp.initDataUnsafe.user || null;
  }

  /**
   * Получить информацию о чате
   */
  public getChatInfo() {
    if (!this.webApp) {
      console.warn(`${this.logPrefix} WebApp is not available`);
      return null;
    }

    return this.webApp.initDataUnsafe.chat || null;
  }

  /**
   * Получить платформу
   */
  public getPlatform() {
    if (!this.webApp) {
      console.warn(`${this.logPrefix} WebApp is not available`);
      return null;
    }

    return this.webApp.platform;
  }

  /**
   * Получить версию MAX
   */
  public getVersion() {
    if (!this.webApp) {
      console.warn(`${this.logPrefix} WebApp is not available`);
      return null;
    }

    return this.webApp.version;
  }

  /**
   * Подписка на события
   */
  public onEvent(eventName: WebAppEventType, callback: WebAppEventCallback): void {
    if (!this.webApp) {
      console.warn(`${this.logPrefix} WebApp is not available`);
      return;
    }

    console.log(`${this.logPrefix} Subscribe to event:`, eventName);
    this.webApp.onEvent(eventName, callback);
  }

  /**
   * Отписка от событий
   */
  public offEvent(eventName: WebAppEventType, callback: WebAppEventCallback): void {
    if (!this.webApp) {
      console.warn(`${this.logPrefix} WebApp is not available`);
      return;
    }

    console.log(`${this.logPrefix} Unsubscribe from event:`, eventName);
    this.webApp.offEvent(eventName, callback);
  }

  /**
   * Сообщить, что приложение готово
   */
  public ready(): void {
    if (!this.webApp) {
      console.warn(`${this.logPrefix} WebApp is not available`);
      return;
    }

    console.log(`${this.logPrefix} App is ready`);
    this.webApp.ready();
  }

  /**
   * Закрыть мини-приложение
   */
  public close(): void {
    if (!this.webApp) {
      console.warn(`${this.logPrefix} WebApp is not available`);
      return;
    }

    console.log(`${this.logPrefix} Closing app`);
    this.webApp.close();
  }

  /**
   * Запросить номер телефона пользователя
   */
  public async requestContact(): Promise<{ phone: string } | null> {
    if (!this.webApp) {
      console.warn(`${this.logPrefix} WebApp is not available`);
      return null;
    }

    console.log(`${this.logPrefix} Requesting contact`);
    try {
      const result = await this.webApp.requestContact();
      console.log(`${this.logPrefix} Contact received:`, result);
      return result;
    } catch (error) {
      console.error(`${this.logPrefix} Failed to request contact:`, error);
      return null;
    }
  }

  /**
   * Управление кнопкой "Назад"
   */
  public backButton = {
    show: (): void => {
      if (!this.webApp) return;
      console.log(`${this.logPrefix} Show back button`);
      this.webApp.BackButton.show();
    },

    hide: (): void => {
      if (!this.webApp) return;
      console.log(`${this.logPrefix} Hide back button`);
      this.webApp.BackButton.hide();
    },

    onClick: (callback: () => void): void => {
      if (!this.webApp) return;
      console.log(`${this.logPrefix} Set back button click handler`);
      this.webApp.BackButton.onClick(callback);
    },

    offClick: (callback: () => void): void => {
      if (!this.webApp) return;
      console.log(`${this.logPrefix} Remove back button click handler`);
      this.webApp.BackButton.offClick(callback);
    },

    isVisible: (): boolean => {
      if (!this.webApp) return false;
      return this.webApp.BackButton.isVisible;
    },
  };

  /**
   * Управление скриншотами
   */
  public screenCapture = {
    enable: (): void => {
      if (!this.webApp) return;
      console.log(`${this.logPrefix} Enable screen capture`);
      this.webApp.ScreenCapture.enableScreenCapture();
    },

    disable: (): void => {
      if (!this.webApp) return;
      console.log(`${this.logPrefix} Disable screen capture`);
      this.webApp.ScreenCapture.disableScreenCapture();
    },

    isEnabled: (): boolean => {
      if (!this.webApp) return false;
      return this.webApp.ScreenCapture.isScreenCaptureEnabled;
    },
  };

  /**
   * Тактильная обратная связь
   */
  public haptic = {
    impact: (style: ImpactStyle, disableVibrationFallback = false): void => {
      if (!this.webApp) return;
      console.log(`${this.logPrefix} Haptic impact:`, style);
      this.webApp.HapticFeedback.impactOccurred(style, disableVibrationFallback);
    },

    notification: (type: NotificationType, disableVibrationFallback = false): void => {
      if (!this.webApp) return;
      console.log(`${this.logPrefix} Haptic notification:`, type);
      this.webApp.HapticFeedback.notificationOccurred(type, disableVibrationFallback);
    },

    selectionChanged: (disableVibrationFallback = false): void => {
      if (!this.webApp) return;
      console.log(`${this.logPrefix} Haptic selection changed`);
      this.webApp.HapticFeedback.selectionChanged(disableVibrationFallback);
    },
  };

  /**
   * Включить подтверждение при закрытии
   */
  public enableClosingConfirmation(): void {
    if (!this.webApp) return;
    console.log(`${this.logPrefix} Enable closing confirmation`);
    this.webApp.enableClosingConfirmation();
  }

  /**
   * Отключить подтверждение при закрытии
   */
  public disableClosingConfirmation(): void {
    if (!this.webApp) return;
    console.log(`${this.logPrefix} Disable closing confirmation`);
    this.webApp.disableClosingConfirmation();
  }

  /**
   * Открыть ссылку во внешнем браузере
   */
  public openLink(url: string): void {
    if (!this.webApp) return;
    console.log(`${this.logPrefix} Open link:`, url);
    this.webApp.openLink(url);
  }

  /**
   * Открыть ссылку внутри MAX
   */
  public openMaxLink(url: string): void {
    if (!this.webApp) return;
    console.log(`${this.logPrefix} Open MAX link:`, url);
    this.webApp.openMaxLink(url);
  }

  /**
   * Нативный шаринг
   */
  public async shareContent(text: string, link: string): Promise<ShareStatus | null> {
    if (!this.webApp) return null;
    console.log(`${this.logPrefix} Share content:`, { text, link });

    try {
      const result = await this.webApp.shareContent(text, link);
      console.log(`${this.logPrefix} Share result:`, result);
      return result.status;
    } catch (error) {
      console.error(`${this.logPrefix} Failed to share:`, error);
      return null;
    }
  }

  /**
   * Шаринг внутри MAX
   */
  public async shareMaxContent(text: string, link: string): Promise<ShareStatus | null> {
    if (!this.webApp) return null;
    console.log(`${this.logPrefix} Share MAX content:`, { text, link });

    try {
      const result = await this.webApp.shareMaxContent(text, link);
      console.log(`${this.logPrefix} Share MAX result:`, result);
      return result.status;
    } catch (error) {
      console.error(`${this.logPrefix} Failed to share in MAX:`, error);
      return null;
    }
  }

  /**
   * Скачать файл
   */
  public async downloadFile(url: string, fileName: string): Promise<void> {
    if (!this.webApp) return;
    console.log(`${this.logPrefix} Download file:`, { url, fileName });

    try {
      await this.webApp.downloadFile(url, fileName);
      console.log(`${this.logPrefix} File downloaded successfully`);
    } catch (error) {
      console.error(`${this.logPrefix} Failed to download file:`, error);
    }
  }

  /**
   * Открыть камеру для сканирования QR-кода
   */
  public async openCodeReader(fileSelect = true): Promise<string | null> {
    if (!this.webApp) return null;
    console.log(`${this.logPrefix} Open code reader:`, { fileSelect });

    try {
      const result = await this.webApp.openCodeReader(fileSelect);
      console.log(`${this.logPrefix} QR code scanned:`, result.value);
      return result.value;
    } catch (error) {
      console.error(`${this.logPrefix} Failed to scan QR code:`, error);
      return null;
    }
  }

  /**
   * Хранилище устройства (если доступно)
   */
  public storage = {
    setItem: async (key: string, value: string): Promise<void> => {
      if (!this.webApp?.DeviceStorage) {
        console.warn(`${this.logPrefix} DeviceStorage is not available`);
        return;
      }
      console.log(`${this.logPrefix} Storage set:`, key);
      await this.webApp.DeviceStorage.setItem(key, value);
    },

    getItem: async (key: string): Promise<string | null> => {
      if (!this.webApp?.DeviceStorage) {
        console.warn(`${this.logPrefix} DeviceStorage is not available`);
        return null;
      }
      console.log(`${this.logPrefix} Storage get:`, key);
      const value = await this.webApp.DeviceStorage.getItem(key);
      console.log(`${this.logPrefix} Storage value:`, value);
      return value;
    },

    removeItem: async (key: string): Promise<void> => {
      if (!this.webApp?.DeviceStorage) {
        console.warn(`${this.logPrefix} DeviceStorage is not available`);
        return;
      }
      console.log(`${this.logPrefix} Storage remove:`, key);
      await this.webApp.DeviceStorage.removeItem(key);
    },

    clear: async (): Promise<void> => {
      if (!this.webApp?.DeviceStorage) {
        console.warn(`${this.logPrefix} DeviceStorage is not available`);
        return;
      }
      console.log(`${this.logPrefix} Storage clear`);
      await this.webApp.DeviceStorage.clear();
    },
  };

  /**
   * Защищённое хранилище (если доступно)
   */
  public secureStorage = {
    setItem: async (key: string, value: string): Promise<void> => {
      if (!this.webApp?.SecureStorage) {
        console.warn(`${this.logPrefix} SecureStorage is not available`);
        return;
      }
      console.log(`${this.logPrefix} Secure storage set:`, key);
      await this.webApp.SecureStorage.setItem(key, value);
    },

    getItem: async (key: string): Promise<string | null> => {
      if (!this.webApp?.SecureStorage) {
        console.warn(`${this.logPrefix} SecureStorage is not available`);
        return null;
      }
      console.log(`${this.logPrefix} Secure storage get:`, key);
      const value = await this.webApp.SecureStorage.getItem(key);
      console.log(`${this.logPrefix} Secure storage value:`, value);
      return value;
    },

    removeItem: async (key: string): Promise<void> => {
      if (!this.webApp?.SecureStorage) {
        console.warn(`${this.logPrefix} SecureStorage is not available`);
        return;
      }
      console.log(`${this.logPrefix} Secure storage remove:`, key);
      await this.webApp.SecureStorage.removeItem(key);
    },
  };

  /**
   * Биометрия (если доступно)
   */
  public biometric = {
    init: async (): Promise<void> => {
      if (!this.webApp?.BiometricManager) {
        console.warn(`${this.logPrefix} BiometricManager is not available`);
        return;
      }
      console.log(`${this.logPrefix} Biometric init`);
      await this.webApp.BiometricManager.init();
    },

    requestAccess: async (): Promise<boolean> => {
      if (!this.webApp?.BiometricManager) {
        console.warn(`${this.logPrefix} BiometricManager is not available`);
        return false;
      }
      console.log(`${this.logPrefix} Biometric request access`);
      const result = await this.webApp.BiometricManager.requestAccess();
      console.log(`${this.logPrefix} Biometric access result:`, result);
      return result;
    },

    authenticate: async (): Promise<boolean> => {
      if (!this.webApp?.BiometricManager) {
        console.warn(`${this.logPrefix} BiometricManager is not available`);
        return false;
      }
      console.log(`${this.logPrefix} Biometric authenticate`);
      const result = await this.webApp.BiometricManager.authenticate();
      console.log(`${this.logPrefix} Biometric auth result:`, result);
      return result;
    },

    updateToken: async (token: string): Promise<void> => {
      if (!this.webApp?.BiometricManager) {
        console.warn(`${this.logPrefix} BiometricManager is not available`);
        return;
      }
      console.log(`${this.logPrefix} Biometric update token`);
      await this.webApp.BiometricManager.updateBiometricToken(token);
    },

    openSettings: (): void => {
      if (!this.webApp?.BiometricManager) {
        console.warn(`${this.logPrefix} BiometricManager is not available`);
        return;
      }
      console.log(`${this.logPrefix} Biometric open settings`);
      this.webApp.BiometricManager.openSettings();
    },

    getInfo: () => {
      if (!this.webApp?.BiometricManager) {
        console.warn(`${this.logPrefix} BiometricManager is not available`);
        return null;
      }

      return {
        isInited: this.webApp.BiometricManager.isInited,
        isBiometricAvailable: this.webApp.BiometricManager.isBiometricAvailable,
        biometricType: this.webApp.BiometricManager.biometricType,
        deviceId: this.webApp.BiometricManager.deviceId,
        isAccessRequested: this.webApp.BiometricManager.isAccessRequested,
        isAccessGranted: this.webApp.BiometricManager.isAccessGranted,
        isBiometricTokenSaved: this.webApp.BiometricManager.isBiometricTokenSaved,
      };
    },
  };

  /**
   * Настройка слушателей всех событий для логирования
   */
  private setupEventListeners(): void {
    if (!this.webApp) return;

    const events: WebAppEventType[] = [
      'WebAppReady',
      'WebAppClose',
      'WebAppSetupBackButton',
      'WebAppRequestPhone',
      'WebAppSetupClosingBehavior',
      'WebAppBackButtonPressed',
      'WebAppOpenLink',
      'WebAppOpenMaxLink',
      'WebAppShare',
      'WebAppMaxShare',
      'WebAppSetupScreenCaptureBehavior',
      'WebAppHapticFeedbackImpact',
      'WebAppHapticFeedbackNotification',
      'WebAppHapticFeedbackSelectionChange',
      'WebAppOpenCodeReader',
      'WebAppDownloadFile',
      'WebAppCopyText',
    ];

    events.forEach((eventName) => {
      this.webApp?.onEvent(eventName, (eventData?: unknown) => {
        console.log(`${this.logPrefix} Event [${eventName}]:`, eventData);
      });
    });
  }
}

// Экспортируем синглтон
export const maxBridgeService = new MaxBridgeService();

