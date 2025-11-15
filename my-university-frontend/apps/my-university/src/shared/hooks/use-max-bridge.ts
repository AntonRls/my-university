import { useEffect, useMemo } from 'react';

import { maxBridgeService } from '@api/services';

/**
 * Хук для работы с MAX Bridge
 * Предоставляет информацию о доступности и основные данные
 */
export function useMaxBridge() {
  const isAvailable = maxBridgeService.isAvailable();
  
  const user = useMemo(
    () => (isAvailable ? maxBridgeService.getUserInfo() : null),
    [isAvailable]
  );
  
  const platform = useMemo(
    () => (isAvailable ? maxBridgeService.getPlatform() : null),
    [isAvailable]
  );
  
  const version = useMemo(
    () => (isAvailable ? maxBridgeService.getVersion() : null),
    [isAvailable]
  );

  return {
    isAvailable,
    user,
    platform,
    version,
    service: maxBridgeService,
  };
}

/**
 * Хук для управления кнопкой "Назад"
 * Автоматически показывает кнопку и устанавливает обработчик
 */
export function useBackButton(onBack: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled || !maxBridgeService.isAvailable()) {
      return;
    }

    maxBridgeService.backButton.show();
    maxBridgeService.backButton.onClick(onBack);

    return () => {
      maxBridgeService.backButton.hide();
      maxBridgeService.backButton.offClick(onBack);
    };
  }, [onBack, enabled]);
}

/**
 * Хук для подтверждения закрытия приложения
 * Показывает предупреждение о потере данных при закрытии
 */
export function useClosingConfirmation(enabled = true) {
  useEffect(() => {
    if (!maxBridgeService.isAvailable()) {
      return;
    }

    if (enabled) {
      maxBridgeService.enableClosingConfirmation();
    } else {
      maxBridgeService.disableClosingConfirmation();
    }

    return () => {
      maxBridgeService.disableClosingConfirmation();
    };
  }, [enabled]);
}

