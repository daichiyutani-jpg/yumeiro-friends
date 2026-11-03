// Service Worker の登録と、オフライン準備の状態確認
import { create } from 'zustand';

/**
 * 更新の ようす。スタート画面は checking / installing / applying の あいだ「はじめる」を おせない。
 * idle: 更新なし（または しらべられなかった）
 */
export type UpdatePhase = 'idle' | 'checking' | 'installing' | 'applying';

interface PwaState {
  supported: boolean;
  ready: boolean;
  cached: number;
  total: number;
  version: string | null;
  updateWaiting: boolean;
  phase: UpdatePhase;
}

export const usePwa = create<PwaState>(() => ({ supported: false, ready: false, cached: 0, total: 0, version: null, updateWaiting: false, phase: 'idle' }));

/** 更新の しらべ・よみこみが ながく かかる ときは あそべるように する（でんぱが わるい とき など） */
const CHECK_TIMEOUT_MS = 6000;
const INSTALL_TIMEOUT_MS = 25000;

let waiting: ServiceWorker | null = null;
let installTimer: ReturnType<typeof setTimeout> | null = null;

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
  if (!waiting) return;
  usePwa.setState({ phase: 'applying' });
  waiting.postMessage({ type: 'SKIP_WAITING' });
}

function setWaiting(w: ServiceWorker): void {
  waiting = w;
  if (installTimer) clearTimeout(installTimer);
  usePwa.setState({ updateWaiting: true, phase: usePwa.getState().phase === 'applying' ? 'applying' : 'idle' });
}

function setInstalling(): void {
  usePwa.setState({ phase: 'installing' });
  if (installTimer) clearTimeout(installTimer);
  installTimer = setTimeout(() => {
    if (usePwa.getState().phase === 'installing') usePwa.setState({ phase: 'idle' });
  }, INSTALL_TIMEOUT_MS);
}

export function registerServiceWorker(): void {
  // 開発サーバー（vite dev）では登録しない。本番ビルド（npm run build → preview / 公開）でだけ動く
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  const hadController = !!navigator.serviceWorker.controller;
  // まえに インストール ずみ なら、スタートの まえに 更新を しらべる
  usePwa.setState({ supported: true, phase: hadController && navigator.onLine ? 'checking' : 'idle' });
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      const track = (w: ServiceWorker | null) => {
        if (!w) return;
        if (navigator.serviceWorker.controller) setInstalling();
        w.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) setWaiting(w);
          if (w.state === 'redundant' && usePwa.getState().phase === 'installing') usePwa.setState({ phase: 'idle' });
          if (w.state === 'activated') void checkOfflineStatus();
        });
      };
      if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
      track(reg.installing);
      reg.addEventListener('updatefound', () => track(reg.installing));
      // 初めての インストール時（まだ制御されていない）は 再読み込みしない。更新を適用した時だけ読み込み直す
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded || !hadController) return;
        reloaded = true;
        location.reload();
      });
      if (hadController && navigator.onLine) {
        // あたらしい バージョンが あるか サーバーに きく（みつかれば updatefound → installing になる）
        await Promise.race([reg.update().catch(() => {}), new Promise((r) => setTimeout(r, CHECK_TIMEOUT_MS))]);
        if (usePwa.getState().phase === 'checking') usePwa.setState({ phase: 'idle' });
      }
      await navigator.serviceWorker.ready;
      await checkOfflineStatus();
    } catch {
      // 登録に失敗しても ゲームは そのまま遊べる
      if (usePwa.getState().phase !== 'applying') usePwa.setState({ phase: 'idle' });
    }
  });
}
