// IndexedDB へのセーブ・ロード。オンラインの友達データとは別の DB 名・ストアにする。
import { migrate } from '../game/logic/migrate';
import type { SaveData } from '../game/types';

const DB_NAME = 'yumeiro-friends';
const DB_VERSION = 1;
const STORE = 'save';
const MAIN_KEY = 'slot1';
const BACKUP_KEY = 'slot1-backup';

export class SaveError extends Error {}

function openDb(idb: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = idb.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB を ひらけませんでした'));
    req.onblocked = () => reject(new Error('IndexedDB が ほかの タブで つかわれています'));
  });
}

export interface SaveStore {
  load(): Promise<{ data: SaveData | null; fromBackup: boolean; error?: string }>;
  save(data: SaveData): Promise<void>;
  clear(): Promise<void>;
}

export function createSaveStore(idb: IDBFactory | null = globalThis.indexedDB ?? null): SaveStore {
  let dbPromise: Promise<IDBDatabase> | null = null;
  const db = () => {
    if (!idb) return Promise.reject(new SaveError('この ブラウザでは セーブ できません（IndexedDB が ありません）'));
    dbPromise ??= openDb(idb).catch((e) => {
      dbPromise = null;
      throw e;
    });
    return dbPromise;
  };

  function get(key: string): Promise<unknown> {
    return db().then(
      (d) =>
        new Promise((resolve, reject) => {
          const tx = d.transaction(STORE, 'readonly');
          const req = tx.objectStore(STORE).get(key);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        }),
    );
  }

  return {
    async load() {
      let mainErr: string | undefined;
      try {
        const raw = await get(MAIN_KEY);
        if (raw !== undefined) return { data: migrate(raw), fromBackup: false };
      } catch (e) {
        mainErr = e instanceof Error ? e.message : String(e);
      }
      // 本体が読めない時は、ひとつ前のセーブ（バックアップ）を試す
      try {
        const raw = await get(BACKUP_KEY);
        if (raw !== undefined) return { data: migrate(raw), fromBackup: true, error: mainErr };
      } catch (e) {
        mainErr ??= e instanceof Error ? e.message : String(e);
      }
      return { data: null, fromBackup: false, error: mainErr };
    },

    async save(data) {
      const d = await db();
      // 1つのトランザクションで「今のセーブ → バックアップ」「新しいセーブ → 本体」を行う（途中で失敗したら両方とも元のまま）
      await new Promise<void>((resolve, reject) => {
        const tx = d.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const cur = store.get(MAIN_KEY);
        cur.onsuccess = () => {
          if (cur.result !== undefined) store.put(cur.result, BACKUP_KEY);
          store.put(structuredClone(data), MAIN_KEY);
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(new SaveError(tx.error?.message ?? 'セーブに しっぱい しました'));
        tx.onabort = () => reject(new SaveError(tx.error?.message ?? 'セーブが ちゅうだん されました'));
      });
    },

    async clear() {
      const d = await db();
      await new Promise<void>((resolve, reject) => {
        const tx = d.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(MAIN_KEY);
        tx.objectStore(STORE).delete(BACKUP_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },
  };
}
