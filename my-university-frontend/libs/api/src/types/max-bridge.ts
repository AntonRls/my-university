/* eslint-disable no-unused-vars */
/**
 * MAX Bridge API Types
 * @see https://dev.max.ru/docs/webapps/bridge
 */

/**
 * Платформа, с которой запущено мини-приложение
 */
export type Platform = 'ios' | 'android' | 'desktop' | 'web';

/**
 * Тип чата
 */
export type ChatType = 'private' | 'group' | 'supergroup' | 'channel';

/**
 * Стиль тактильной обратной связи
 */
export type ImpactStyle = 'soft' | 'light' | 'medium' | 'heavy' | 'rigid';

/**
 * Тип уведомления для тактильной обратной связи
 */
export type NotificationType = 'error' | 'success' | 'warning';

/**
 * Тип биометрии
 */
export type BiometricType = 'fingerprint' | 'faceid' | 'unknown';

/**
 * Статус шаринга
 */
export type ShareStatus = 'shared' | 'cancelled';

/**
 * Объект с данными о чате
 */
export type Chat = {
  id: number;
  type: ChatType;
};

/**
 * Объект с данными о пользователе
 */
export type WebAppUser = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  language_code: string;
  photo_url: string;
};

/**
 * Дополнительные данные при запуске
 * Максимум 512 символов: A-Z, a-z, 0-9, _, -
 */
export type WebAppStartParam = string;

/**
 * Данные при запуске мини-приложения
 */
export type WebAppData = {
  query_id: string;
  auth_date: number;
  hash: string;
  start_param?: WebAppStartParam;
  user?: WebAppUser;
  chat?: Chat;
};

/**
 * Кнопка "Назад"
 */
export type BackButton = {
  isVisible: boolean;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
  show: () => void;
  hide: () => void;
};

/**
 * Управление скриншотами
 */
export type ScreenCapture = {
  isScreenCaptureEnabled: boolean;
  enableScreenCapture: () => void;
  disableScreenCapture: () => void;
};

/**
 * Тактильная обратная связь
 */
export type HapticFeedback = {
  impactOccurred: (impactStyle: ImpactStyle, disableVibrationFallback?: boolean) => void;
  notificationOccurred: (notificationType: NotificationType, disableVibrationFallback?: boolean) => void;
  selectionChanged: (disableVibrationFallback?: boolean) => void;
};

/**
 * Локальное хранилище
 */
export type DeviceStorage = {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
};

/**
 * Защищённое хранилище
 */
export type SecureStorage = {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
};

/**
 * Менеджер биометрии
 */
export type BiometricManager = {
  isInited: boolean;
  init: () => Promise<void>;
  isBiometricAvailable: boolean;
  biometricType: BiometricType[];
  deviceId: string | null;
  isAccessRequested: boolean;
  isAccessGranted: boolean;
  isBiometricTokenSaved: boolean;
  requestAccess: () => Promise<boolean>;
  authenticate: () => Promise<boolean>;
  updateBiometricToken: (token: string) => Promise<void>;
  openSettings: () => void;
};

/**
 * События MAX Bridge
 */
export type WebAppEventType =
  | 'WebAppReady'
  | 'WebAppClose'
  | 'WebAppSetupBackButton'
  | 'WebAppRequestPhone'
  | 'WebAppSetupClosingBehavior'
  | 'WebAppBackButtonPressed'
  | 'WebAppOpenLink'
  | 'WebAppOpenMaxLink'
  | 'WebAppShare'
  | 'WebAppMaxShare'
  | 'WebAppSetupScreenCaptureBehavior'
  | 'WebAppHapticFeedbackImpact'
  | 'WebAppHapticFeedbackNotification'
  | 'WebAppHapticFeedbackSelectionChange'
  | 'WebAppOpenCodeReader'
  | 'WebAppDownloadFile'
  | 'WebAppCopyText';

/**
 * Callback для событий
 */
export type WebAppEventCallback = (eventData?: unknown) => void;

/**
 * Главный объект WebApp
 */
export type WebApp = {
  initData: string;
  initDataUnsafe: WebAppData;
  platform: Platform;
  version: string;
  onEvent: (eventName: WebAppEventType, callback: WebAppEventCallback) => void;
  offEvent: (eventName: WebAppEventType, callback: WebAppEventCallback) => void;
  ready: () => void;
  close: () => void;
  requestContact: () => Promise<{ phone: string }>;
  BackButton: BackButton;
  ScreenCapture: ScreenCapture;
  HapticFeedback: HapticFeedback;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  openLink: (url: string) => void;
  openMaxLink: (url: string) => void;
  shareContent: (text: string, link: string) => Promise<{ status: ShareStatus }>;
  shareMaxContent: (text: string, link: string) => Promise<{ status: ShareStatus }>;
  downloadFile: (url: string, fileName: string) => Promise<void>;
  openCodeReader: (fileSelect?: boolean) => Promise<{ value: string }>;
  DeviceStorage?: DeviceStorage;
  SecureStorage?: SecureStorage;
  BiometricManager?: BiometricManager;
};

/**
 * Глобальный объект Window с WebApp
 */
declare global {
  interface Window {
    WebApp?: WebApp;
  }
}

