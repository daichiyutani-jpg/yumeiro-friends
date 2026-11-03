// うみの せかいの ヤシの き・いわ の配置と当たり判定。描画（three）と移動判定の両方で使う。
import type { Circle } from './forestLayout';
import { SEA } from './data/sea';

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const keySpots: { x: number; z: number }[] = [
  SEA.portal, SEA.spawn, ...SEA.chests, ...SEA.puzzles, ...SEA.encounters, ...SEA.pickups, ...SEA.switches, SEA.sign, ...SEA.parasols,
];
const nearKey = (x: number, z: number, d: number) => keySpots.some((k) => Math.hypot(k.x - x, k.z - z) < d);

export interface SeaLayout {
  palms: { x: number; z: number; s: number; lean: number }[];
  rocks: { x: number; z: number; s: number }[];
  /** いりえを かこむ いわ */
  wall: { x: number; z: number; s: number }[];
  starfish: { x: number; z: number; color: string }[];
  colliders: Circle[];
}

let cached: SeaLayout | null = null;

export function seaLayout(): SeaLayout {
  if (cached) return cached;
  const r = rng(20261104);
  const b = SEA.bounds;
  const palms: SeaLayout['palms'] = [];
  // おくと みぎの ふちに ならぶ ヤシの き（ひだりは うみ）
  for (let x = b.minX + 1; x <= b.maxX; x += 2.8) {
    palms.push({ x: x + r() * 0.8, z: b.minZ - 1.4 - r(), s: 1 + r() * 0.3, lean: r() - 0.5 });
    r(); r(); r(); r(); // てまえの れつは カメラを ふさぐので おかない（ならびが かわらないように 乱数だけ すすめる）
  }
  for (let z = b.minZ; z <= b.maxZ; z += 2.8) palms.push({ x: b.maxX + 1.4 + r(), z: z + r() * 0.8, s: 1 + r() * 0.3, lean: r() - 0.5 });
  // なかの ヤシ（道・大事な場所・いりえの いわを さける）
  let tries = 0;
  const inner = palms.length;
  while (palms.length < inner + 20 && tries < 1500) {
    tries++;
    const x = b.minX + 1.5 + r() * (b.maxX - b.minX - 3);
    const z = b.minZ + 1.5 + r() * (b.maxZ - b.minZ - 3);
    if (Math.abs(x) < 3) continue; // 中央の道
    if (Math.abs(z - 3) < 2.2 && x > 0 && x < 12) continue; // いりえへの 道
    if (x < -9) continue; // なみうちぎわは ひらけた すなはま
    if (Math.abs(x - SEA.coveWall.x) < 2.5) continue;
    if (Math.hypot(x - SEA.lighthouse.x, z - SEA.lighthouse.z) < 5) continue;
    if (nearKey(x, z, 3.2)) continue;
    if (palms.some((t) => Math.hypot(t.x - x, t.z - z) < 3)) continue;
    palms.push({ x, z, s: 0.8 + r() * 0.4, lean: r() - 0.5 });
  }

  const wall: SeaLayout['wall'] = [];
  const w = SEA.coveWall;
  for (let z = w.z1; z <= w.z2 + 0.01; z += 0.9) if (Math.abs(z - w.gapZ) > 1.2) wall.push({ x: w.x, z, s: 0.55 + r() * 0.2 });
  for (let x = w.x + 0.9; x <= b.maxX + 0.5; x += 0.9) {
    wall.push({ x, z: w.z1, s: 0.55 + r() * 0.2 });
    wall.push({ x, z: w.z2, s: 0.55 + r() * 0.2 });
  }

  const rocks: SeaLayout['rocks'] = [];
  for (let i = 0; i < 12; i++) {
    const x = b.minX + r() * (b.maxX - b.minX);
    const z = b.minZ + r() * (b.maxZ - b.minZ);
    if (Math.abs(x) < 3 || nearKey(x, z, 3) || Math.abs(x - w.x) < 2 || x > w.x) continue;
    rocks.push({ x, z, s: 0.3 + r() * 0.3 });
  }

  const starfish: SeaLayout['starfish'] = [];
  const sc = ['#ff9ec7', '#ffd84d', '#ffb38a', '#cdb8ff'];
  for (let i = 0; i < 40; i++) {
    const x = b.minX + r() * (b.maxX - b.minX);
    const z = b.minZ + r() * (b.maxZ - b.minZ);
    if (Math.abs(x) < 1.5 || nearKey(x, z, 1.5)) continue;
    starfish.push({ x, z, color: sc[i % sc.length] });
  }

  const colliders: Circle[] = [
    ...palms.map((t) => ({ x: t.x, z: t.z, r: 0.35 * t.s + 0.1 })),
    ...rocks.map((q) => ({ x: q.x, z: q.z, r: q.s + 0.15 })),
    ...wall.map((q) => ({ x: q.x, z: q.z, r: q.s + 0.05 })),
    ...SEA.obstacles,
    ...SEA.parasols.map((p) => ({ x: p.x, z: p.z, r: 0.3 })),
  ];
  cached = { palms, rocks, wall, starfish, colliders };
  return cached;
}
