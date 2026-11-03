// 3つめ いこうの ワールドの かざり（キャンディ・クリスタル など）の 配置と 当たり判定。描画と 移動判定の 両方で使う。
import type { WorldMap } from './data/forest';
import type { Circle } from './forestLayout';

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export interface ThemeLayout {
  /** おおきな かざり（当たり判定あり） */
  decor: { x: number; z: number; s: number; c: number }[];
  /** じめんの ちいさな もよう（当たり判定なし） */
  dots: { x: number; z: number; c: number }[];
  colliders: Circle[];
}

const cache = new Map<string, ThemeLayout>();

export function themeLayout(map: WorldMap): ThemeLayout {
  const hit = cache.get(map.id);
  if (hit) return hit;
  let seed = 7;
  for (const ch of map.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const r = rng(seed);
  const b = map.bounds;
  const lm = map.theme?.landmark;
  const keySpots = [map.portal, map.spawn, map.sign, ...map.chests, ...map.puzzles, ...map.encounters, ...map.pickups, ...map.switches];
  const nearKey = (x: number, z: number, d: number) => keySpots.some((k) => Math.hypot(k.x - x, k.z - z) < d);
  const nColors = Math.max(1, map.theme?.decorColors.length ?? 1);

  const decor: ThemeLayout['decor'] = [];
  // おくと さゆうの ふち（てまえは カメラを ふさぐので おかない）
  for (let x = b.minX - 1; x <= b.maxX + 1; x += 2.6) decor.push({ x: x + r() * 0.8, z: b.minZ - 1.5 - r(), s: 1 + r() * 0.35, c: Math.floor(r() * nColors) });
  for (let z = b.minZ; z <= b.maxZ; z += 2.6) {
    decor.push({ x: b.minX - 1.5 - r(), z: z + r() * 0.8, s: 1 + r() * 0.35, c: Math.floor(r() * nColors) });
    decor.push({ x: b.maxX + 1.5 + r(), z: z + r() * 0.8, s: 1 + r() * 0.35, c: Math.floor(r() * nColors) });
  }
  // なかの かざり（まんなかの みち・だいじな ばしょ・めじるし・スイッチの ひろばを さける）
  const inner = decor.length;
  let tries = 0;
  while (decor.length < inner + 24 && tries < 2000) {
    tries++;
    const x = b.minX + 1.5 + r() * (b.maxX - b.minX - 3);
    const z = b.minZ + 1.5 + r() * (b.maxZ - b.minZ - 3);
    if (Math.abs(x) < 2.8) continue;
    if (z < -16.5 && Math.abs(x) < 7.5) continue;
    if (lm && Math.hypot(x - lm.x, z - lm.z) < lm.r + 2) continue;
    if (nearKey(x, z, 3.2)) continue;
    if (decor.some((d) => Math.hypot(d.x - x, d.z - z) < 2.8)) continue;
    decor.push({ x, z, s: 0.75 + r() * 0.4, c: Math.floor(r() * nColors) });
  }

  const dots: ThemeLayout['dots'] = [];
  for (let i = 0; i < 120; i++) {
    const x = b.minX + r() * (b.maxX - b.minX);
    const z = b.minZ + r() * (b.maxZ - b.minZ);
    if (Math.abs(x) < 1.4) continue;
    dots.push({ x, z, c: i % nColors });
  }

  const colliders: Circle[] = [...decor.map((d) => ({ x: d.x, z: d.z, r: 0.45 * d.s + 0.1 })), ...map.obstacles];
  const out = { decor, dots, colliders };
  cache.set(map.id, out);
  return out;
}
