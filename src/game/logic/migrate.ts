// セーブデータの移行と整合性チェック。読み込んだデータは必ずここを通す。
import { DEFAULT_FLOORING, DEFAULT_WALLPAPER, getFurniture, getOutfit, isSurface } from '../data/catalog';
import { getItem } from '../data/items';
import { hasSpecies } from '../data/species';
import type { SaveData } from '../types';
import { GARDEN_PLOTS, MAX_COINS, MAX_STACK, MAX_TEAM, SAVE_VERSION, createNewSave } from './core';
import { clampToRoom, ownsSurface, wallPos } from './life';

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, def: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : def);
const count = (v: unknown, max: number): number => Math.max(0, Math.min(max, Math.floor(num(v, 0))));

/**
 * バージョンごとの移行。新しい項目を足したら、ここに1段ふやす。
 * v1 → v2: おてつだい（town.helpers / helperFound）と 大きい文字設定（settings.bigText）を追加。
 * v2 → v3: まちづくり → おうちづくり。かべがみ・ゆかを足し、おそとの ひろさ(±6)で おいた かぐを おへや(±4.5)に ちぢめる。
 */
const MIGRATIONS: Record<number, (d: Raw) => Raw> = {
  1: (d) => {
    const town = isObj(d.town) ? d.town : {};
    const settings = isObj(d.settings) ? d.settings : {};
    return { ...d, version: 2, town: { helpers: [], helperFound: 0, ...town }, settings: { bigText: false, ...settings } };
  },
  2: (d) => {
    const town = isObj(d.town) ? d.town : {};
    const placed = (Array.isArray(town.placed) ? town.placed : []).map((p) =>
      isObj(p) ? { ...p, x: Math.round(num(p.x, 0) * 0.75 * 2) / 2, z: Math.round(num(p.z, 0) * 0.75 * 2) / 2 } : p,
    );
    return { ...d, version: 3, town: { wallpaper: DEFAULT_WALLPAPER, flooring: DEFAULT_FLOORING, ...town, placed } };
  },
};

export class SaveFormatError extends Error {}

export function migrate(input: unknown): SaveData {
  if (!isObj(input)) throw new SaveFormatError('セーブデータの かたちが ちがいます');
  let d: Raw = input;
  let v = num(d.version, 0);
  if (v < 1) throw new SaveFormatError('セーブデータの バージョンが わかりません');
  if (v > SAVE_VERSION) throw new SaveFormatError('あたらしい バージョンの セーブデータです。アプリを こうしんしてね');
  while (v < SAVE_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) throw new SaveFormatError(`バージョン ${v} からの いこうが ありません`);
    d = step(d);
    v = num(d.version, v + 1);
  }
  return sanitize(d);
}

/** おかしな値（マイナス・存在しないID・重複）を直して、必ず正しい形の SaveData を返す */
export function sanitize(d: Raw): SaveData {
  const player = isObj(d.player) ? d.player : {};
  const base = createNewSave(
    {
      name: typeof player.name === 'string' && player.name.trim() ? player.name.slice(0, 8) : 'ゆめ',
      hairStyle: (['long', 'twin', 'bob', 'bun'] as const).find((h) => h === player.hairStyle) ?? 'long',
      hairColor: typeof player.hairColor === 'string' ? player.hairColor : '#8a5a44',
      eyeColor: typeof player.eyeColor === 'string' ? player.eyeColor : '#5a3d8a',
      skinColor: typeof player.skinColor === 'string' ? player.skinColor : '#ffe0cc',
    },
    num(d.createdAt, Date.now()),
  );
  const s = base;
  s.updatedAt = num(d.updatedAt, s.createdAt);
  s.coins = count(d.coins, MAX_COINS);

  s.items = {};
  if (isObj(d.items)) for (const [k, v] of Object.entries(d.items)) if (getItem(k)) {
    const c = count(v, MAX_STACK);
    if (c > 0) s.items[k] = c;
  }

  const outfits = Array.isArray(d.ownedOutfits) ? d.ownedOutfits.filter((o): o is string => typeof o === 'string' && !!getOutfit(o)) : [];
  s.ownedOutfits = [...new Set([...s.ownedOutfits, ...outfits])];
  if (isObj(d.equipped)) {
    for (const slot of Object.keys(s.equipped) as (keyof SaveData['equipped'])[]) {
      const id = d.equipped[slot];
      if (id === null && slot !== 'top' && slot !== 'shoes') s.equipped[slot] = null;
      else if (typeof id === 'string' && s.ownedOutfits.includes(id) && getOutfit(id)?.slot === slot) s.equipped[slot] = id;
    }
  }
  s.princess = d.princess === true && !!s.equipped.dress;

  const seen = new Set<string>();
  s.friends = (Array.isArray(d.friends) ? d.friends : []).flatMap((f) => {
    if (!isObj(f) || typeof f.uid !== 'string' || seen.has(f.uid)) return [];
    if (typeof f.speciesId !== 'string' || !hasSpecies(f.speciesId)) return [];
    const baseId = typeof f.baseId === 'string' && hasSpecies(f.baseId) ? f.baseId : f.speciesId;
    seen.add(f.uid);
    return [{
      uid: f.uid,
      speciesId: f.speciesId,
      baseId,
      nickname: typeof f.nickname === 'string' ? f.nickname.slice(0, 8) : undefined,
      level: Math.max(1, Math.min(30, Math.floor(num(f.level, 1)))),
      exp: count(f.exp, 100000),
      affection: count(f.affection, 100),
      obtainedAt: num(f.obtainedAt, 0),
      lastCare: isObj(f.lastCare) ? Object.fromEntries(Object.entries(f.lastCare).filter(([, v]) => typeof v === 'number')) : {},
    }];
  });
  s.team = (Array.isArray(d.team) ? d.team : []).filter((u): u is string => typeof u === 'string' && seen.has(u));
  s.team = [...new Set(s.team)].slice(0, MAX_TEAM);

  s.dex = {};
  if (isObj(d.dex)) for (const [k, v] of Object.entries(d.dex)) if (hasSpecies(k) && (v === 'seen' || v === 'owned')) s.dex[k] = v;
  for (const f of s.friends) s.dex[f.speciesId] = 'owned';

  const forest = isObj(d.forest) ? d.forest : {};
  const strList = (v: unknown) => [...new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])];
  s.forest = {
    openedChests: strList(forest.openedChests),
    solvedPuzzles: strList(forest.solvedPuzzles),
    befriended: strList(forest.befriended),
    picked: isObj(forest.picked) ? Object.fromEntries(Object.entries(forest.picked).filter(([, v]) => typeof v === 'number')) as Record<string, number> : {},
    visits: count(forest.visits, 1e9),
  };

  const town = isObj(d.town) ? d.town : {};
  s.town.furniture = {};
  if (isObj(town.furniture)) for (const [k, v] of Object.entries(town.furniture)) if (getFurniture(k)) {
    const c = count(v, MAX_STACK);
    if (c > 0) s.town.furniture[k] = c;
  }
  s.town.placed = (Array.isArray(town.placed) ? town.placed : []).flatMap((p) => {
    if (!isObj(p) || typeof p.uid !== 'string' || typeof p.furnitureId !== 'string') return [];
    const def = getFurniture(p.furnitureId);
    if (!def || isSurface(def)) return [];
    const x = num(p.x, 0);
    const z = num(p.z, 0);
    if (def.kind === 'wall') {
      const wall = p.wall === 'left' ? 'left' : 'back';
      return [{ uid: p.uid, furnitureId: p.furnitureId, ...wallPos(wall, x, z), rot: 0, wall }];
    }
    return [{ uid: p.uid, furnitureId: p.furnitureId, ...clampToRoom(x, z), rot: count(p.rot, 3) }];
  });
  const surface = (v: unknown, kind: 'wallpaper' | 'flooring', def: string) =>
    typeof v === 'string' && getFurniture(v)?.kind === kind && ownsSurface(s, v) ? v : def;
  s.town.wallpaper = surface(town.wallpaper, 'wallpaper', DEFAULT_WALLPAPER);
  s.town.flooring = surface(town.flooring, 'flooring', DEFAULT_FLOORING);
  s.town.helpers = (Array.isArray(town.helpers) ? town.helpers : []).flatMap((h) =>
    isObj(h) && typeof h.uid === 'string' && seen.has(h.uid) ? [{ uid: h.uid, startedAt: num(h.startedAt, 0) }] : [],
  );
  s.town.helperFound = count(town.helperFound, 1e9);

  const garden = Array.isArray(d.garden) ? d.garden : [];
  s.garden = Array.from({ length: GARDEN_PLOTS }, (_, i) => {
    const g = garden[i];
    if (isObj(g) && typeof g.seedId === 'string' && getItem(g.seedId)) return { seedId: g.seedId, plantedAt: num(g.plantedAt, 0), readyAt: num(g.readyAt, 0) };
    return { seedId: null, plantedAt: 0, readyAt: 0 };
  });

  s.eggs = (Array.isArray(d.eggs) ? d.eggs : []).flatMap((e) =>
    isObj(e) && typeof e.uid === 'string' && typeof e.eggId === 'string'
      ? [{ uid: e.uid, eggId: e.eggId, startedAt: num(e.startedAt, 0), readyAt: num(e.readyAt, 0) }]
      : [],
  );

  const tut = isObj(d.tutorial) ? d.tutorial : {};
  s.tutorial = { step: count(tut.step, 99), done: tut.done === true };
  const st = isObj(d.settings) ? d.settings : {};
  s.settings = { sound: st.sound !== false, reduceMotion: st.reduceMotion === true, bigText: st.bigText === true };
  const clock = isObj(d.clock) ? d.clock : {};
  s.clock = { gameTime: num(clock.gameTime, s.createdAt), lastReal: num(clock.lastReal, s.createdAt), warned: clock.warned === true };
  const stats = isObj(d.stats) ? d.stats : {};
  for (const k of Object.keys(s.stats) as (keyof SaveData['stats'])[]) s.stats[k] = count(stats[k], 1e9);
  s.achievements = strList(d.achievements);
  // uid が重ならないように、既存の uid の数字より大きくする
  const maxUid = [...s.friends.map((f) => f.uid), ...s.town.placed.map((p) => p.uid), ...s.eggs.map((e) => e.uid)]
    .map((u) => parseInt(u.replace(/^\D+/, ''), 10))
    .filter(Number.isFinite)
    .reduce((a, b) => Math.max(a, b), 0);
  s.nextUid = Math.max(count(d.nextUid, 1e9), maxUid + 1, 1);
  return s;
}
