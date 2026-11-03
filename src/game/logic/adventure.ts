// 冒険（さくらの森・うみの せかい）のロジック: 宝箱・謎解き・出会い・落とし物
// 進みぐあいは ワールドを またいで s.forest に まとめて 記録する（ID が ワールドごとに ちがうので まざらない）
import { FOREST, type PuzzleDef, type WorldMap } from '../data/forest';
import { findChest, findEncounter, findPickup, findPuzzle, getWorldMap } from '../data/maps';
import { ABILITY_INFO, getSpecies } from '../data/species';
import type { Result, SaveData } from '../types';
import { addItemsMut, clone, fail, hasItems, ok, removeItemsMut } from './core';
import { addFriendMut, displayName, friendAbilities, gainTeamExpMut, getFriend, markDex, teamAbilities } from './friends';

export function isSolved(s: SaveData, puzzleId: string): boolean {
  return s.forest.solvedPuzzles.includes(puzzleId);
}

export function getPuzzle(id: string): PuzzleDef | undefined {
  return findPuzzle(id);
}

/** チームに仲良し度50以上の仲間がいると、宝箱のコインが少し増える */
export function chestCoinBonus(s: SaveData): number {
  return s.team.some((uid) => (getFriend(s, uid)?.affection ?? 0) >= 50) ? 1.2 : 1;
}

export function openChest(state: SaveData, chestId: string): Result {
  const chest = findChest(chestId);
  if (!chest) return fail('たからばこが みつからないよ');
  if (state.forest.openedChests.includes(chestId)) return fail('もう あけた たからばこだよ');
  if ('lockedBy' in chest && chest.lockedBy && !isSolved(state, chest.lockedBy)) {
    return fail(`${getPuzzle(chest.lockedBy)?.name ?? 'しかけ'}を とかないと とどかないよ`);
  }
  const s = clone(state);
  s.forest.openedChests.push(chestId);
  const reward: Record<string, number> = { ...chest.reward };
  if (reward.coins) reward.coins = Math.round(reward.coins * chestCoinBonus(s));
  addItemsMut(s, reward);
  const outfit = 'outfit' in chest ? chest.outfit : undefined;
  if (outfit && !s.ownedOutfits.includes(outfit)) s.ownedOutfits.push(outfit);
  gainTeamExpMut(s, chest.exp);
  s.stats.chests += 1;
  return ok(s, 'たからばこを あけた！', { reward, outfit, exp: chest.exp });
}

export type PuzzleMethod = { kind: 'ability'; friendUid: string } | { kind: 'item' } | { kind: 'switch' };

/** その謎解きに使える方法の一覧（表示用） */
export function puzzleOptions(s: SaveData, puzzleId: string): { friendUid?: string; canUseItem: boolean; itemHave: number } {
  const p = getPuzzle(puzzleId);
  if (!p) return { canUseItem: false, itemHave: 0 };
  const helper = p.ability ? teamAbilities(s).get(p.ability) : undefined;
  const have = p.alt ? (s.items[p.alt.item] ?? 0) : 0;
  return { friendUid: helper?.uid, canUseItem: !!p.alt && have >= p.alt.count, itemHave: have };
}

export function solvePuzzle(state: SaveData, puzzleId: string, method: PuzzleMethod): Result {
  const p = getPuzzle(puzzleId);
  if (!p) return fail('しかけが みつからないよ');
  if (isSolved(state, puzzleId)) return fail('もう といた しかけだよ');
  const s = clone(state);
  let by = '';
  if (method.kind === 'ability') {
    if (!p.ability) return fail('この しかけは スイッチで とくよ');
    const f = getFriend(s, method.friendUid);
    if (!f || !s.team.includes(f.uid)) return fail('チームの なかまを えらんでね');
    if (!friendAbilities(f).includes(p.ability)) return fail(`${ABILITY_INFO[p.ability].name}の ちからが ひつようだよ`);
    by = `${displayName(f)}の ${ABILITY_INFO[p.ability].name}の ちから`;
  } else if (method.kind === 'item') {
    if (!p.alt) return fail('アイテムでは とけないよ');
    const cost = { [p.alt.item]: p.alt.count };
    if (p.alt.consume) {
      if (!removeItemsMut(s, cost)) return fail('アイテムが たりないよ');
    } else if (!hasItems(s, cost)) return fail('アイテムが たりないよ');
    by = p.alt.text;
  } else {
    if (p.ability !== null) return fail('スイッチでは とけないよ');
    by = 'スイッチ';
  }
  s.forest.solvedPuzzles.push(puzzleId);
  gainTeamExpMut(s, 20);
  return ok(s, p.solvedText, { by });
}

/** スイッチの押した順番が正しいか。まちがえても ペナルティは ない */
export function checkSwitchOrder(pressed: string[], map: WorldMap = FOREST): 'ok' | 'continue' | 'wrong' {
  const order = map.switchOrder;
  for (let i = 0; i < pressed.length; i++) if (pressed[i] !== order[i]) return 'wrong';
  return pressed.length === order.length ? 'ok' : 'continue';
}

export function befriend(state: SaveData, encounterId: string): Result {
  const e = findEncounter(encounterId);
  if (!e) return fail('だれも いないよ');
  if (state.forest.befriended.includes(encounterId)) return fail('もう なかまに なっているよ');
  const s = clone(state);
  s.forest.befriended.push(encounterId);
  const f = addFriendMut(s, e.species);
  gainTeamExpMut(s, 10);
  return ok(s, `${getSpecies(e.species).name}が なかまに なった！`, f.uid);
}

export function seeEncounter(state: SaveData, encounterId: string): SaveData {
  const e = findEncounter(encounterId);
  if (!e || state.dex[e.species]) return state;
  const s = clone(state);
  markDex(s, e.species, 'seen');
  return s;
}

export function isPickupAvailable(s: SaveData, pickupId: string, now: number): boolean {
  const t = s.forest.picked[pickupId];
  const respawn = findPickup(pickupId)?.map.pickupRespawnMs ?? FOREST.pickupRespawnMs;
  return t === undefined || now - t >= respawn || now < t;
}

export function pickUp(state: SaveData, pickupId: string, now: number): Result {
  const pk = findPickup(pickupId)?.pickup;
  if (!pk) return fail('なにも ないよ');
  if (!isPickupAvailable(state, pickupId, now)) return fail('また あとで はえてくるよ');
  const s = clone(state);
  s.forest.picked[pickupId] = now;
  addItemsMut(s, { [pk.item]: pk.count });
  return ok(s, undefined, { [pk.item]: pk.count });
}

/** その ワールドの 進みぐあい（ほかの ワールドの ぶんは かぞえない） */
export function forestProgress(s: SaveData, worldId = 'sakura'): { chests: number; chestTotal: number; puzzles: number; puzzleTotal: number; friends: number; friendTotal: number } {
  const m = getWorldMap(worldId);
  return {
    chests: m.chests.filter((c) => s.forest.openedChests.includes(c.id)).length,
    chestTotal: m.chests.length,
    puzzles: m.puzzles.filter((p) => s.forest.solvedPuzzles.includes(p.id)).length,
    puzzleTotal: m.puzzles.length,
    friends: m.encounters.filter((e) => s.forest.befriended.includes(e.id)).length,
    friendTotal: m.encounters.length,
  };
}

/** うみの せかいは さくらの森で たからばこを 3こ あけると いける */
export const SEA_UNLOCK_CHESTS = 3;
export function isWorldUnlocked(s: SaveData, worldId: string): boolean {
  if (worldId === 'sakura') return true;
  if (worldId === 'sea') return forestProgress(s, 'sakura').chests >= SEA_UNLOCK_CHESTS;
  return false;
}

export function enterForest(state: SaveData): SaveData {
  const s = clone(state);
  s.forest.visits += 1;
  return s;
}
