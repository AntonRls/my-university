import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MaxUI } from '@maxhub/max-ui';
import { Toaster } from 'sonner';

import '@maxhub/max-ui/dist/styles.css';

import { initMaxBridgeMock } from '@shared/config/max-bridge-mock';
import { authService, maxBridgeService, userService } from '@api/services';

import './index.scss';
import App from './App.tsx';

// Инициализация мока MAX Bridge (только для dev-режима)
void initMaxBridgeMock();

// Инициализация MAX Bridge Service
maxBridgeService.init();

// Инициализация User Service (получение данных пользователя)
userService.init();

// Авторизация пользователя в бекенде
void authService.init();

// Сообщить MAX, что приложение готово к работе
if (maxBridgeService.isAvailable()) {
  maxBridgeService.ready();
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true }}>
      <MaxUI>
        <App />
        <Toaster position="top-center" theme="dark" />
      </MaxUI>
    </BrowserRouter>
  </StrictMode>,
);
