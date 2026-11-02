import { DEFAULT_FLOORING, DEFAULT_WALLPAPER, STARTER_OUTFITS } from '../data/catalog';
import { getItem } from '../data/items';
import type { PlayerLook, Result, SaveData } from '../types';

export const SAVE_VERSION = 3;
export const MAX_TEAM = 3;
export const MAX_STACK = 999;
export const MAX_COINS = 999_999;
export const GARDEN_PLOTS = 6;
export const MAX_EGG_SLOTS = 4;

export function clone<T>(v: T): T {
  return structuredClone(v);
}

export function ok(state: SaveData, message?: string, data?: unknown): Result {
  return { ok: true, state, message, data };
}
export function fail(reason: string): Result {
  return { ok: false, reason };
}

export function newUid(s: SaveData, prefix: string): string {
  const id = `${prefix}${s.nextUid}`;
  s.nextUid += 1;
  return id;
}

export function createNewSave(look: PlayerLook, realNow: number): SaveData {
  return {
    version: SAVE_VERSION,
    createdAt: realNow,
    updatedAt: realNow,
    player: { ...look },
    equipped: { top: 'top_pink', bottom: 'bt_skirt_blue', shoes: 'sh_pink', hat: null, accessory: null, tiara: null, dress: null },
    ownedOutfits: [...STARTER_OUTFITS],
    princess: false,
    coins: 200,
    items: { cookie: 5, strawberry: 2, seed_sakura: 2, seed_cotton: 1 },
    friends: [],
    team: [],
    dex: {},
    forest: { openedChests: [], solvedPuzzles: [], befriended: [], picked: {}, visits: 0 },
    town: { placed: [], wallpaper: DEFAULT_WALLPAPER, flooring: DEFAULT_FLOORING, furniture: { chair: 1, pot: 2, rug_round: 1, frame: 1 }, helpers: [], helperFound: 0 },
    garden: Array.from({ length: GARDEN_PLOTS }, () => ({ seedId: null, plantedAt: 0, readyAt: 0 })),
    eggs: [],
    tutorial: { step: 1, done: false },
    settings: { sound: true, reduceMotion: false, bigText: false },
    clock: { gameTime: realNow, lastReal: realNow, warned: false },
    stats: { chests: 0, minigames: 0, bestScore: 0, harvests: 0, hatched: 0, evolutions: 0 },
    achievements: [],
    nextUid: 1,
  };
}

// ---------- アイテム・コイン ----------

export function itemCount(s: SaveData, id: string): number {
  if (id === 'coins') return s.coins;
  return s.items[id] ?? 0;
}

export function hasItems(s: SaveData, cost: Record<string, number>): boolean {
  return Object.entries(cost).every(([id, n]) => itemCount(s, id) >= n);
}

/** 足りない物の一覧（表示用） */
export function missingItems(s: SaveData, cost: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, n] of Object.entries(cost)) {
    const have = itemCount(s, id);
    if (have < n) out[id] = n - have;
  }
  return out;
}

function validCount(n: number): boolean {
  return Number.isInteger(n) && n >= 0;
}

/**
 * アイテム（'coins' 含む）を増やす。s を直接書き換える（clone 済みのものに使う）。
 * 上限を超えた分は切り捨てる。
 */
export function addItemsMut(s: SaveData, gain: Record<string, number>): void {
  for (const [id, n] of Object.entries(gain)) {
    if (!validCount(n) || n === 0) continue;
    if (id === 'coins') {
      s.coins = Math.min(MAX_COINS, s.coins + n);
    } else {
      s.items[id] = Math.min(MAX_STACK, (s.items[id] ?? 0) + n);
    }
  }
}

/** 全部そろっている時だけ まとめて減らす。足りなければ何も変えずに false */
export function removeItemsMut(s: SaveData, cost: Record<string, number>): boolean {
  for (const n of Object.values(cost)) if (!validCount(n)) return false;
  if (!hasItems(s, cost)) return false;
  for (const [id, n] of Object.entries(cost)) {
    if (n === 0) continue;
    if (id === 'coins') s.coins -= n;
    else {
      const left = (s.items[id] ?? 0) - n;
      if (left > 0) s.items[id] = left;
      else delete s.items[id];
    }
  }
  return true;
}

export function addItems(state: SaveData, gain: Record<string, number>): Result {
  const s = clone(state);
  addItemsMut(s, gain);
  return ok(s);
}

export function removeItems(state: SaveData, cost: Record<string, number>): Result {
  const s = clone(state);
  if (!removeItemsMut(s, cost)) return fail('たりない ものが あるよ');
  return ok(s);
}

export function isKnownItem(id: string): boolean {
  return id === 'coins' || !!getItem(id);
}
