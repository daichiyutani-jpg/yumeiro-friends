// ぼうけん先の マップの 一覧。ID から マップや 宝箱・しかけ を ひく。
import { FOREST, type ChestDef, type EncounterDef, type PickupDef, type PuzzleDef, type WorldMap } from './forest';
import { SEA } from './sea';

export const WORLD_MAPS: WorldMap[] = [FOREST, SEA];

export function getWorldMap(id: string | null | undefined): WorldMap {
  return WORLD_MAPS.find((m) => m.id === id) ?? FOREST;
}

export function findChest(id: string): ChestDef | undefined {
  for (const m of WORLD_MAPS) {
    const c = m.chests.find((x) => x.id === id);
    if (c) return c;
  }
  return undefined;
}

export function findPuzzle(id: string): PuzzleDef | undefined {
  for (const m of WORLD_MAPS) {
    const p = m.puzzles.find((x) => x.id === id);
    if (p) return p;
  }
  return undefined;
}

export function findEncounter(id: string): EncounterDef | undefined {
  for (const m of WORLD_MAPS) {
    const e = m.encounters.find((x) => x.id === id);
    if (e) return e;
  }
  return undefined;
}

export function findPickup(id: string): { pickup: PickupDef; map: WorldMap } | undefined {
  for (const m of WORLD_MAPS) {
    const p = m.pickups.find((x) => x.id === id);
    if (p) return { pickup: p, map: m };
  }
  return undefined;
}
