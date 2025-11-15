import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

import { authService } from '@api/services';

import { App } from './App';

import './index.css';

// Авторизация пользователя в бекенде
void authService.init();

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container with id "root" was not found');
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true }}>
      <App />
      <Toaster position="top-center" theme="dark" />
    </BrowserRouter>
  </StrictMode>,
);
