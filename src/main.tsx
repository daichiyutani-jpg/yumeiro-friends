import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { registerServiceWorker } from './pwa';
import { installAutoFlush, useGame } from './state/store';
import { installTouchGuard } from './ui/touchGuard';
import './ui/styles.css';

installAutoFlush();
installTouchGuard();
void useGame.getState().init();
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
