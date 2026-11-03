// さくらの森の 木・しげみ の配置と当たり判定。描画（three）と移動判定の両方で使う。
import { FOREST } from './data/forest';
import { getWorldMap } from './data/maps';
import { seaLayout } from './seaLayout';
import { themeLayout } from './themeLayout';

export interface Circle {
  x: number;
  z: number;
  r: number;
  until?: string;
}

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const keySpots: { x: number; z: number }[] = [
  FOREST.portal, FOREST.spawn, ...FOREST.chests, ...FOREST.puzzles, ...FOREST.encounters, ...FOREST.pickups, ...FOREST.switches, FOREST.sign,
];

function nearKey(x: number, z: number, d: number): boolean {
  return keySpots.some((k) => Math.hypot(k.x - x, k.z - z) < d);
}

function inRect(x: number, z: number, r: { x1: number; x2: number; z1: number; z2: number }, pad: number): boolean {
  return x > r.x1 - pad && x < r.x2 + pad && z > r.z1 - pad && z < r.z2 + pad;
}

export interface ForestLayout {
  trees: { x: number; z: number; s: number; tint: number }[];
  bushes: { x: number; z: number; color: string }[];
  hedges: { x: number; z: number }[];
  rocks: { x: number; z: number; s: number }[];
  flowers: { x: number; z: number; color: string }[];
  colliders: Circle[];
}

let cached: ForestLayout | null = null;

export function forestLayout(): ForestLayout {
  if (cached) return cached;
  const r = rng(20261103);
  const b = FOREST.bounds;
  const trees: ForestLayout['trees'] = [];
  // まわりを囲む木
  for (let x = b.minX; x <= b.maxX; x += 2.6) {
    trees.push({ x: x + r() * 0.8, z: b.minZ - 1.2 - r(), s: 1 + r() * 0.4, tint: r() });
    trees.push({ x: x + r() * 0.8, z: b.maxZ + 1.2 + r(), s: 1 + r() * 0.4, tint: r() });
  }
  for (let z = b.minZ; z <= b.maxZ; z += 2.6) {
    trees.push({ x: b.minX - 1.2 - r(), z: z + r() * 0.8, s: 1 + r() * 0.4, tint: r() });
    trees.push({ x: b.maxX + 1.2 + r(), z: z + r() * 0.8, s: 1 + r() * 0.4, tint: r() });
  }
  // なかの木（道・小川・大事な場所を さける）
  let tries = 0;
  while (trees.length < 120 && tries < 2000) {
    tries++;
    const x = b.minX + 1 + r() * (b.maxX - b.minX - 2);
    const z = b.minZ + 1 + r() * (b.maxZ - b.minZ - 2);
    if (Math.abs(x) < 3) continue; // 中央の道
    if (Math.abs(z - FOREST.stream.z) < 2.5) continue;
    if (nearKey(x, z, 3.2)) continue;
    if (x > 13 && x < 17) continue; // 生け垣のまわり
    if (x > 15) continue; // 隠し通路の先は ひらけた場所
    if (inRect(x, z, FOREST.flowerFence, 1.5)) continue;
    if (Math.hypot(x - FOREST.cave.x, z - FOREST.cave.z) < 5) continue;
    if (Math.abs(z - 6) < 1.8 && x < 0 && x > -10) continue; // つるの とびらへの道
    if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 2.4)) continue;
    trees.push({ x, z, s: 0.8 + r() * 0.5, tint: r() });
  }

  // 花のかきね（入り口だけ あける）
  const bushes: ForestLayout['bushes'] = [];
  const f = FOREST.flowerFence;
  const gate = FOREST.puzzles.find((p) => p.id === 'p_flower')!;
  const colors = ['#ff9ec7', '#ffc0da', '#ffffff', '#ffb3d1'];
  const addBush = (x: number, z: number) => {
    if (Math.hypot(x - gate.x, z - gate.z) < 1.5) return;
    bushes.push({ x, z, color: colors[bushes.length % colors.length] });
  };
  for (let x = f.x1; x <= f.x2 + 0.01; x += 0.8) {
    addBush(x, f.z1);
    addBush(x, f.z2);
  }
  for (let z = f.z1 + 0.8; z < f.z2; z += 0.8) {
    addBush(f.x1, z);
    addBush(f.x2 + 0.4, z);
  }

  const hedges: ForestLayout['hedges'] = [];
  for (const h of FOREST.hedges) for (let z = h.z1; z <= h.z2; z += 0.75) hedges.push({ x: (h.x1 + h.x2) / 2, z });
  // 隠し通路の先の広場を 囲む
  for (let x = 15.5; x <= b.maxX; x += 0.75) {
    hedges.push({ x, z: -16 });
    hedges.push({ x, z: 6 });
  }

  const rocks: ForestLayout['rocks'] = [];
  for (let i = 0; i < 14; i++) {
    const x = b.minX + r() * (b.maxX - b.minX);
    const z = b.minZ + r() * (b.maxZ - b.minZ);
    if (Math.abs(x) < 3 || nearKey(x, z, 3) || x > 13 || Math.abs(z - FOREST.stream.z) < 2 || inRect(x, z, f, 1)) continue;
    rocks.push({ x, z, s: 0.35 + r() * 0.35 });
  }

  const flowers: ForestLayout['flowers'] = [];
  const fc = ['#ffffff', '#ffd1e3', '#fff3a0', '#d9c4ff', '#ff9ec7', '#bfe6ff'];
  for (let i = 0; i < 260; i++) {
    const x = b.minX + r() * (b.maxX - b.minX);
    const z = b.minZ + r() * (b.maxZ - b.minZ);
    if (Math.abs(x) < 1.2 || Math.abs(z - FOREST.stream.z) < 1.7) continue;
    flowers.push({ x, z, color: fc[i % fc.length] });
  }

  const colliders: Circle[] = [
    ...trees.map((t) => ({ x: t.x, z: t.z, r: 0.45 * t.s + 0.1 })),
    ...bushes.map((q) => ({ x: q.x, z: q.z, r: 0.45 })),
    ...hedges.map((q) => ({ x: q.x, z: q.z, r: 0.5 })),
    ...rocks.map((q) => ({ x: q.x, z: q.z, r: q.s + 0.15 })),
    ...FOREST.obstacles,
    { x: FOREST.cave.x, z: FOREST.cave.z, r: 2.8 },
  ];
  cached = { trees, bushes, hedges, rocks, flowers, colliders };
  return cached;
}

/** 円の当たり判定と 範囲の端で 押し戻す */
export function resolveMove(x: number, z: number, radius: number, solved: readonly string[], worldId = 'sakura'): { x: number; z: number } {
  const b = getWorldMap(worldId).bounds;
  let nx = Math.max(b.minX, Math.min(b.maxX, x));
  let nz = Math.max(b.minZ, Math.min(b.maxZ, z));
  const map = getWorldMap(worldId);
  const colliders = worldId === 'sea' ? seaLayout().colliders : map.theme ? themeLayout(map).colliders : forestLayout().colliders;
  for (const c of colliders) {
    if (c.until && solved.includes(c.until)) continue;
    const dx = nx - c.x;
    const dz = nz - c.z;
    const min = c.r + radius;
    const d2 = dx * dx + dz * dz;
    if (d2 < min * min) {
      const d = Math.sqrt(d2) || 0.0001;
      nx = c.x + (dx / d) * min;
      nz = c.z + (dz / d) * min;
    }
  }
  return { x: nx, z: nz };
}
