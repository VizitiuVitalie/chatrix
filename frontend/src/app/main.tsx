import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/shared/i18n/config';

import { registerServiceWorker } from '@/modules/push/services/sw-registration.service';

import { App } from './App';
import '../index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void registerServiceWorker();
