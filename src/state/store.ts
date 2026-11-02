// 画面とセーブデータの状態。ゲームの計算は src/game/logic の純粋な関数に任せ、ここでは
// 「結果を state に入れる」「セーブを予約する」「メッセージを出す」だけを行う。
import { create } from 'zustand';
import { createNewSave } from '../game/logic/core';
import { advanceClock, MAX_JUMP } from '../game/logic/time';
import { advanceTutorial, type TutorialEvent } from '../game/logic/tutorial';
import type { PlayerLook, Result, SaveData } from '../game/types';
import { createSaveStore, type SaveStore } from '../save/storage';
import { sfx } from '../ui/sound';

export type ScreenId =
  | 'home' | 'adventure' | 'worlds' | 'friends' | 'friend' | 'dressup' | 'dex' | 'items' | 'town'
  | 'eggs' | 'shop' | 'garden' | 'minigame' | 'social' | 'settings';

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'good' | 'warn';
}

interface GameStore {
  status: 'loading' | 'title' | 'create' | 'playing' | 'error';
  save: SaveData | null;
  loadError: string | null;
  saveError: string | null;
  lastSavedAt: number | null;
  screen: ScreenId;
  param: string | null;
  toasts: Toast[];
  init(): Promise<void>;
  startCreate(): void;
  newGame(look: PlayerLook): void;
  continueGame(): void;
  /** ロジック関数の結果を反映する。失敗した時は理由をトーストで出し、state は変えない */
  apply(fn: (s: SaveData, now: number) => Result, opts?: { quiet?: boolean; sound?: keyof typeof sfx }): Result | null;
  /** 失敗しない更新（図鑑の「見た」記録など） */
  patch(fn: (s: SaveData) => SaveData): void;
  tutorial(event: TutorialEvent): void;
  go(screen: ScreenId, param?: string | null): void;
  toast(text: string, kind?: Toast['kind']): void;
  dismissToast(id: number): void;
  flush(): Promise<void>;
  resetAll(): Promise<void>;
  importSave(data: SaveData): Promise<void>;
}

let storage: SaveStore = createSaveStore();
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let toastId = 1;

/** テスト用に保存先を差し替える */
export function setStorage(s: SaveStore): void {
  storage = s;
}

/** いまのゲーム内時刻（セーブを書き換えずに計算する） */
export function gameNow(s: SaveData, realNow = Date.now()): number {
  const d = realNow - s.clock.lastReal;
  return s.clock.gameTime + Math.max(0, Math.min(MAX_JUMP, d));
}

export const useGame = create<GameStore>((set, get) => {
  function scheduleSave(): void {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void get().flush(), 700);
  }

  function setSave(s: SaveData): void {
    set({ save: s });
    scheduleSave();
  }

  return {
    status: 'loading',
    save: null,
    loadError: null,
    saveError: null,
    lastSavedAt: null,
    screen: 'home',
    param: null,
    toasts: [],

    async init() {
      try {
        const res = await storage.load();
        if (res.data) {
          const s = advanceClock(res.data, Date.now());
          set({ save: s, status: 'title', loadError: res.fromBackup ? 'セーブデータが こわれていたので、ひとつまえの セーブから よみこみました。' : null });
          if (s.clock.warned) get().toast('たんまつの じこくが おおきく かわったので、じかんの すすみを ちょうせい しました', 'warn');
        } else {
          set({ status: 'title', loadError: res.error ? `セーブデータを よみこめませんでした（${res.error}）` : null });
        }
      } catch (e) {
        set({ status: 'title', loadError: `セーブデータを よみこめませんでした（${e instanceof Error ? e.message : e}）` });
      }
    },

    startCreate() {
      set({ status: 'create' });
    },

    newGame(look) {
      let s = createNewSave(look, Date.now());
      s = advanceTutorial(s, 'created');
      // 最初の仲間は キャラ作成の後の「であい」画面で受け取る（home 画面で処理）
      set({ save: s, status: 'playing', screen: 'home', param: 'welcome' });
      void get().flush();
    },

    continueGame() {
      set({ status: 'playing', screen: 'home', param: null });
    },

    apply(fn, opts) {
      const cur = get().save;
      if (!cur) return null;
      const r = fn(cur, gameNow(cur));
      if (r.ok) {
        setSave(r.state);
        if (r.message && !opts?.quiet) get().toast(r.message, 'good');
        sfx[opts?.sound ?? 'ok']?.();
      } else {
        if (!opts?.quiet) get().toast(r.reason, 'warn');
        sfx.no();
      }
      return r;
    },

    patch(fn) {
      const cur = get().save;
      if (!cur) return;
      const next = fn(cur);
      if (next !== cur) setSave(next);
    },

    tutorial(event) {
      const cur = get().save;
      if (!cur) return;
      const next = advanceTutorial(cur, event);
      if (next !== cur) {
        setSave(next);
        if (next.tutorial.done) get().toast('チュートリアル クリア！ じゆうに あそんでね', 'good');
      }
    },

    go(screen, param = null) {
      sfx.tap();
      set({ screen, param });
    },

    toast(text, kind = 'info') {
      const id = toastId++;
      set({ toasts: [...get().toasts.slice(-2), { id, text, kind }] });
      setTimeout(() => get().dismissToast(id), 3200);
    },

    dismissToast(id) {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    },

    async flush() {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      const cur = get().save;
      if (!cur) return;
      const s = advanceClock(cur, Date.now());
      s.updatedAt = Date.now();
      try {
        await storage.save(s);
        // 保存中に別の操作があった時は、その新しい state を上書きしない
        if (get().save === cur) set({ save: s });
        set({ saveError: null, lastSavedAt: Date.now() });
      } catch (e) {
        set({ saveError: `セーブ できませんでした。ブラウザの ようりょうや せっていを かくにんしてね（${e instanceof Error ? e.message : e}）` });
      }
    },

    async resetAll() {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = null;
      await storage.clear();
      set({ save: null, status: 'title', screen: 'home', param: null, loadError: null, saveError: null });
    },

    async importSave(data) {
      set({ save: advanceClock(data, Date.now()) });
      await get().flush();
    },
  };
});

/** 画面を閉じる・アプリを切り替える時に すぐ保存する */
export function installAutoFlush(): void {
  const flush = () => void useGame.getState().flush();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
    else {
      // 戻ってきた時は経過時間を反映する
      useGame.getState().patch((s) => advanceClock(s, Date.now()));
    }
  });
  window.addEventListener('pagehide', flush);
}
