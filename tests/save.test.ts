import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { SAVE_VERSION, createNewSave } from '../src/game/logic/core';
import { addFriendMut } from '../src/game/logic/friends';
import { SaveFormatError, migrate } from '../src/game/logic/migrate';
import { createSaveStore } from '../src/save/storage';

const look = { name: 'ゆめ', hairStyle: 'long' as const, hairColor: '#000', eyeColor: '#000', skinColor: '#fff' };

describe('IndexedDB セーブ', () => {
  it('保存したデータを読み込める（再読み込み・再起動を想定して別のストアから読む）', async () => {
    const idb = new IDBFactory();
    const s = createNewSave(look, 1000);
    addFriendMut(s, 'sakuran');
    s.coins = 777;
    s.town.placed.push({ uid: 'p9', furnitureId: 'chair', x: 1, z: 2, rot: 1 });
    await createSaveStore(idb).save(s);
    const loaded = await createSaveStore(idb).load();
    expect(loaded.data?.coins).toBe(777);
    expect(loaded.data?.friends[0].speciesId).toBe('sakuran');
    expect(loaded.data?.town.placed[0]).toMatchObject({ furnitureId: 'chair', x: 1, z: 2 });
    expect(loaded.data!.nextUid).toBeGreaterThan(9);
  });
  it('セーブが無い時は null', async () => {
    const loaded = await createSaveStore(new IDBFactory()).load();
    expect(loaded.data).toBeNull();
  });
  it('初期化すると消える', async () => {
    const idb = new IDBFactory();
    const store = createSaveStore(idb);
    await store.save(createNewSave(look, 1));
    await store.clear();
    expect((await store.load()).data).toBeNull();
  });
  it('IndexedDB が使えない時は分かりやすいエラーになる', async () => {
    const store = createSaveStore(null);
    await expect(store.save(createNewSave(look, 1))).rejects.toThrow(/セーブ/);
  });
});

describe('セーブデータの移行と修復', () => {
  it('古いバージョン(v1)を最新に移行できる', () => {
    const v1 = { ...createNewSave(look, 1), version: 1 } as Record<string, unknown>;
    const town = v1.town as Record<string, unknown>;
    delete town.helpers;
    delete town.helperFound;
    const s = migrate(v1);
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.town.helpers).toEqual([]);
  });
  it('マイナスの所持数や存在しないIDを直す', () => {
    const raw = createNewSave(look, 1) as unknown as Record<string, unknown>;
    raw.coins = -50;
    raw.items = { cookie: -3, petal: 4, unknown_item: 9 };
    raw.friends = [{ uid: 'f1', speciesId: 'nobody' }, { uid: 'f2', speciesId: 'kirakon', level: 99, affection: 500 }];
    raw.team = ['f1', 'f2', 'f2'];
    const s = migrate(raw);
    expect(s.coins).toBe(0);
    expect(s.items).toEqual({ petal: 4 });
    expect(s.friends.length).toBe(1);
    expect(s.friends[0]).toMatchObject({ level: 30, affection: 100 });
    expect(s.team).toEqual(['f2']);
  });
  it('新しすぎる・壊れたデータはエラー', () => {
    expect(() => migrate({ version: SAVE_VERSION + 1 })).toThrow(SaveFormatError);
    expect(() => migrate('broken')).toThrow(SaveFormatError);
  });
});
