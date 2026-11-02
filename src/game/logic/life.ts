// 卵・花壇・おうち・おてつだい など、時間がかかる遊びのロジック
import { getEgg, getFurniture, isSurface } from '../data/catalog';
import { getSeed } from '../data/items';
import { getSpecies } from '../data/species';
import type { EggDef, FurnitureDef, Rarity, Result, SaveData } from '../types';
import { GARDEN_PLOTS, MAX_EGG_SLOTS, addItemsMut, clone, fail, newUid, ok, removeItemsMut } from './core';
import { addFriendMut, getFriend, markDex } from './friends';

const MIN = 60_000;

// ---------- 卵 ----------

/** レアリティ → 種族 の2段階で選ぶ。rng は 0以上1未満を返す関数 */
export function rollEgg(egg: EggDef, rng: () => number): string {
  const r = rng();
  let acc = 0;
  let rarity: Rarity = 1;
  for (const k of [1, 2, 3] as Rarity[]) {
    acc += egg.rates[k];
    if (r < acc) {
      rarity = k;
      break;
    }
    rarity = k;
  }
  const candidates = egg.pool.filter((id) => getSpecies(id).rarity === rarity);
  const list = candidates.length > 0 ? candidates : egg.pool;
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
}

/** 表示用: その卵から出る種族ごとの確率 */
export function eggOdds(egg: EggDef): { speciesId: string; rate: number }[] {
  return egg.pool.map((id) => {
    const rarity = getSpecies(id).rarity;
    const same = egg.pool.filter((p) => getSpecies(p).rarity === rarity).length;
    return { speciesId: id, rate: egg.rates[rarity] / same };
  });
}

export function buyEgg(state: SaveData, eggId: string, now: number): Result {
  const egg = getEgg(eggId);
  if (!egg) return fail('その たまごは ないよ');
  if (state.eggs.length >= MAX_EGG_SLOTS) return fail(`たまごは ${MAX_EGG_SLOTS}こ まで あたためられるよ`);
  const s = clone(state);
  if (!removeItemsMut(s, { coins: egg.price })) return fail('コインが たりないよ');
  s.eggs.push({ uid: newUid(s, 'e'), eggId, startedAt: now, readyAt: now + egg.hatchMinutes * MIN });
  return ok(s, `${egg.name}を あたためはじめたよ`);
}

export function hatchEgg(state: SaveData, eggUid: string, now: number, rng: () => number): Result {
  const slot = state.eggs.find((e) => e.uid === eggUid);
  if (!slot) return fail('たまごが みつからないよ');
  if (now < slot.readyAt) return fail('まだ うまれないみたい。もうすこし まってね');
  const egg = getEgg(slot.eggId);
  if (!egg) return fail('その たまごは ないよ');
  const s = clone(state);
  s.eggs = s.eggs.filter((e) => e.uid !== eggUid);
  const speciesId = rollEgg(egg, rng);
  const f = addFriendMut(s, speciesId);
  s.stats.hatched += 1;
  return ok(s, `${getSpecies(speciesId).name}が うまれたよ！`, f.uid);
}

// ---------- 花壇 ----------

export type PlotStatus = 'empty' | 'seed' | 'growing' | 'ready';

export function plotStatus(s: SaveData, index: number, now: number): PlotStatus {
  const p = s.garden[index];
  if (!p || !p.seedId) return 'empty';
  if (now >= p.readyAt) return 'ready';
  const progress = (now - p.plantedAt) / Math.max(1, p.readyAt - p.plantedAt);
  return progress < 0.3 ? 'seed' : 'growing';
}

export function plotProgress(s: SaveData, index: number, now: number): number {
  const p = s.garden[index];
  if (!p || !p.seedId) return 0;
  return Math.max(0, Math.min(1, (now - p.plantedAt) / Math.max(1, p.readyAt - p.plantedAt)));
}

export function plant(state: SaveData, index: number, seedId: string, now: number): Result {
  if (!Number.isInteger(index) || index < 0 || index >= GARDEN_PLOTS) return fail('その かだんは ないよ');
  if (state.garden[index].seedId) return fail('もう たねが うえてあるよ');
  const seed = getSeed(seedId);
  if (!seed) return fail('たねを えらんでね');
  const s = clone(state);
  if (!removeItemsMut(s, { [seedId]: 1 })) return fail(`${seed.name}を もっていないよ`);
  s.garden[index] = { seedId, plantedAt: now, readyAt: now + seed.growMinutes * MIN };
  return ok(s, `${seed.name}を うえたよ`);
}

export function harvest(state: SaveData, index: number, now: number): Result {
  const p = state.garden[index];
  if (!p || !p.seedId) return fail('なにも うえていないよ');
  if (now < p.readyAt) return fail('まだ そだっているよ');
  const seed = getSeed(p.seedId);
  const s = clone(state);
  s.garden[index] = { seedId: null, plantedAt: 0, readyAt: 0 };
  if (seed) addItemsMut(s, seed.harvest);
  s.stats.harvests += 1;
  return ok(s, 'しゅうかく できたよ！', seed?.harvest ?? {});
}

// ---------- おうちづくり ----------

/** おへやの ゆかで ものを おける はんい（0.5 ごとに そろえる） */
export const ROOM_BOUNDS = { minX: -4.5, maxX: 4.5, minZ: -4.5, maxZ: 4.5 };
/** かべの いち。おくの かべは z = -ROOM_WALL、ひだりの かべは x = -ROOM_WALL */
export const ROOM_WALL = 5;
export const MAX_PLACED = 40;

export type WallSide = 'back' | 'left';

function snap(v: number): number {
  return Math.round(v * 2) / 2;
}
const clampX = (v: number) => Math.max(ROOM_BOUNDS.minX, Math.min(ROOM_BOUNDS.maxX, snap(v)));
const clampZ = (v: number) => Math.max(ROOM_BOUNDS.minZ, Math.min(ROOM_BOUNDS.maxZ, snap(v)));

export function clampToRoom(x: number, z: number): { x: number; z: number } {
  return { x: clampX(x), z: clampZ(z) };
}

/** かべの かざりの いち。back は x だけ、left は z だけ うごく */
export function wallPos(wall: WallSide, x: number, z: number): { x: number; z: number } {
  return wall === 'back' ? { x: clampX(x), z: -ROOM_WALL } : { x: -ROOM_WALL, z: clampZ(z) };
}

/** しまってある家具の数（置いている分は含まない） */
export function storedFurniture(s: SaveData, id: string): number {
  return s.town.furniture[id] ?? 0;
}

/** かべがみ・ゆかを もっているか（さいしょの物は いつでも つかえる） */
export function ownsSurface(s: SaveData, id: string): boolean {
  const def = getFurniture(id);
  return !!def && isSurface(def) && (!!def.starter || storedFurniture(s, id) > 0);
}

function placeAt(def: FurnitureDef, x: number, z: number, wall?: WallSide): { x: number; z: number; wall?: WallSide } | string {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return 'おけない ばしょだよ';
  if (def.kind === 'wall') {
    if (!wall) return 'かべの かざりは かべを タップして かけてね';
    return { ...wallPos(wall, x, z), wall };
  }
  if (wall) return 'かぐは ゆかを タップして おいてね';
  return clampToRoom(x, z);
}

export function placeFurniture(state: SaveData, furnitureId: string, x: number, z: number, wall?: WallSide): Result {
  const def = getFurniture(furnitureId);
  if (!def) return fail('その かぐは ないよ');
  if (isSurface(def)) return fail('かべがみや ゆかは「はりかえる」で つかってね');
  if (storedFurniture(state, furnitureId) <= 0) return fail('しまってある かぐが ないよ');
  if (state.town.placed.length >= MAX_PLACED) return fail(`かぐは ${MAX_PLACED}こ まで おけるよ`);
  const pos = placeAt(def, x, z, wall);
  if (typeof pos === 'string') return fail(pos);
  const s = clone(state);
  s.town.furniture[furnitureId] -= 1;
  if (s.town.furniture[furnitureId] <= 0) delete s.town.furniture[furnitureId];
  const uid = newUid(s, 'p');
  s.town.placed.push({ uid, furnitureId, rot: 0, ...pos });
  return ok(s, undefined, uid);
}

export function moveFurniture(state: SaveData, uid: string, x: number, z: number, wall?: WallSide): Result {
  const cur = state.town.placed.find((q) => q.uid === uid);
  const def = cur && getFurniture(cur.furnitureId);
  if (!cur || !def) return fail('かぐが みつからないよ');
  const pos = placeAt(def, x, z, wall);
  if (typeof pos === 'string') return fail(pos);
  const s = clone(state);
  const p = s.town.placed.find((q) => q.uid === uid)!;
  p.x = pos.x;
  p.z = pos.z;
  if (pos.wall) p.wall = pos.wall;
  return ok(s);
}

export function rotateFurniture(state: SaveData, uid: string): Result {
  const s = clone(state);
  const p = s.town.placed.find((q) => q.uid === uid);
  if (!p) return fail('かぐが みつからないよ');
  if (p.wall) return fail('かべの かざりは まわせないよ');
  p.rot = (p.rot + 1) % 4;
  return ok(s);
}

export function storeFurniture(state: SaveData, uid: string): Result {
  const s = clone(state);
  const p = s.town.placed.find((q) => q.uid === uid);
  if (!p) return fail('かぐが みつからないよ');
  s.town.placed = s.town.placed.filter((q) => q.uid !== uid);
  s.town.furniture[p.furnitureId] = (s.town.furniture[p.furnitureId] ?? 0) + 1;
  return ok(s, 'かぐを しまったよ');
}

/** かべがみ・ゆかを はりかえる。なくならないので、あとで もとに もどせる */
export function setSurface(state: SaveData, id: string): Result {
  const def = getFurniture(id);
  if (!def || !isSurface(def)) return fail('はりかえられないよ');
  if (!ownsSurface(state, id)) return fail(`${def.name}を もっていないよ`);
  const s = clone(state);
  if (def.kind === 'wallpaper') s.town.wallpaper = id;
  else s.town.flooring = id;
  return ok(s, `${def.name}に はりかえたよ`);
}

// ---------- おてつだい（おそとで なかまが 素材を みつける） ----------

export const HELPER_INTERVAL = 20 * MIN;
export const HELPER_MAX_FINDS = 6;
export const MAX_HELPERS = 3;
const HELPER_LOOT = ['petal', 'petal', 'cotton', 'star', 'shell', 'drop', 'clover'];

export function helperFinds(startedAt: number, now: number): number {
  return Math.max(0, Math.min(HELPER_MAX_FINDS, Math.floor((now - startedAt) / HELPER_INTERVAL)));
}

export function toggleHelper(state: SaveData, friendUid: string, now: number): Result {
  if (!getFriend(state, friendUid)) return fail('なかまが みつからないよ');
  const s = clone(state);
  if (s.town.helpers.some((h) => h.uid === friendUid)) {
    s.town.helpers = s.town.helpers.filter((h) => h.uid !== friendUid);
    return ok(s, 'おてつだいを おやすみ したよ');
  }
  if (s.town.helpers.length >= MAX_HELPERS) return fail(`おてつだいは ${MAX_HELPERS}にん までだよ`);
  s.town.helpers.push({ uid: friendUid, startedAt: now });
  return ok(s, 'おそとで そざいを さがしてくれるよ');
}

/** おてつだいで みつけた素材を受け取る。何が見つかるかは rng で決める */
export function collectHelpers(state: SaveData, now: number, rng: () => number): Result {
  const s = clone(state);
  const gain: Record<string, number> = {};
  let total = 0;
  for (const h of s.town.helpers) {
    const n = helperFinds(h.startedAt, now);
    for (let i = 0; i < n; i++) {
      const id = HELPER_LOOT[Math.floor(rng() * HELPER_LOOT.length) % HELPER_LOOT.length];
      gain[id] = (gain[id] ?? 0) + 1;
    }
    // 上限まで たまっていた時は 今から数えなおし、そうでなければ 残りの時間を持ち越す
    if (n >= HELPER_MAX_FINDS) h.startedAt = now;
    else if (n > 0) h.startedAt += n * HELPER_INTERVAL;
    total += n;
  }
  if (total === 0) return fail('まだ なにも みつかっていないよ');
  addItemsMut(s, gain);
  s.town.helperFound += total;
  return ok(s, `そざいを ${total}こ みつけてくれたよ！`, gain);
}

export function dexSeen(state: SaveData, speciesId: string): SaveData {
  if (state.dex[speciesId]) return state;
  const s = clone(state);
  markDex(s, speciesId, 'seen');
  return s;
}
