// Service Worker の登録と、オフライン準備の状態確認
import { create } from 'zustand';

interface PwaState {
  supported: boolean;
  ready: boolean;
  cached: number;
  total: number;
  version: string | null;
  updateWaiting: boolean;
}

export const usePwa = create<PwaState>(() => ({ supported: false, ready: false, cached: 0, total: 0, version: null, updateWaiting: false }));

let waiting: ServiceWorker | null = null;

export async function checkOfflineStatus(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sw = reg?.active;
  if (!sw) return;
  const ch = new MessageChannel();
  const res = await new Promise<{ version: string; total: number; cached: number; complete: boolean } | null>((resolve) => {
    const t = setTimeout(() => resolve(null), 3000);
    ch.port1.onmessage = (e) => {
      clearTimeout(t);
      resolve(e.data);
    };
    sw.postMessage({ type: 'GET_STATUS' }, [ch.port2]);
  });
  if (res) usePwa.setState({ ready: res.complete, cached: res.cached, total: res.total, version: res.version });
}

export function applyUpdate(): void {
  waiting?.postMessage({ type: 'SKIP_WAITING' });
}

export function registerServiceWorker(): void {
  // 開発サーバー（vite dev）では登録しない。本番ビルド（npm run build → preview / 公開）でだけ動く
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  usePwa.setState({ supported: true });
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      const track = (w: ServiceWorker | null) => {
        if (!w) return;
        w.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) {
            waiting = w;
            usePwa.setState({ updateWaiting: true });
          }
          if (w.state === 'activated') void checkOfflineStatus();
        });
      };
      if (reg.waiting && navigator.serviceWorker.controller) {
        waiting = reg.waiting;
        usePwa.setState({ updateWaiting: true });
      }
      track(reg.installing);
      reg.addEventListener('updatefound', () => track(reg.installing));
      // 初めての インストール時（まだ制御されていない）は 再読み込みしない。更新を適用した時だけ読み込み直す
      const hadController = !!navigator.serviceWorker.controller;
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded || !hadController) return;
        reloaded = true;
        location.reload();
      });
      await navigator.serviceWorker.ready;
      await checkOfflineStatus();
    } catch {
      // 登録に失敗しても ゲームは そのまま遊べる
    }
  });
}
