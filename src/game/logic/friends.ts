import { getFood, getItem } from '../data/items';
import { abilitiesOf, getSpecies } from '../data/species';
import type { Ability, CareKind, OwnedFriend, Result, SaveData, Stats } from '../types';
import { MAX_TEAM, clone, fail, hasItems, newUid, ok, removeItemsMut } from './core';

export const MAX_LEVEL = 30;
export const MAX_AFFECTION = 100;

/** そのレベルから次のレベルまでに必要な経験値 */
export function expToNext(level: number): number {
  return 20 + level * 10;
}

export function getFriend(s: SaveData, uid: string): OwnedFriend | undefined {
  return s.friends.find((f) => f.uid === uid);
}

export function friendStats(f: OwnedFriend): Stats {
  const sp = getSpecies(f.speciesId);
  return {
    power: sp.baseStats.power + sp.growth.power * (f.level - 1),
    explore: sp.baseStats.explore + sp.growth.explore * (f.level - 1),
  };
}

export function friendAbilities(f: OwnedFriend): Ability[] {
  return abilitiesOf(getSpecies(f.speciesId));
}

/** 仲良し度で解放されるもの */
export const AFFECTION_REWARDS = [
  { at: 10, text: 'うれしい リアクションを みせてくれる' },
  { at: 20, text: 'しんかが できるように なる' },
  { at: 30, text: 'とくべつな ポーズを みせてくれる' },
  { at: 50, text: 'ぼうけんで たからばこの コインが ふえる' },
  { at: 80, text: 'だいすきの ハートを みせてくれる' },
];

export function markDex(s: SaveData, speciesId: string, state: 'seen' | 'owned'): void {
  if (state === 'owned' || s.dex[speciesId] !== 'owned') s.dex[speciesId] = state;
}

/** なかまを増やす（s を直接書き換える）。チームに空きがあれば自動で入る */
export function addFriendMut(s: SaveData, speciesId: string): OwnedFriend {
  const sp = getSpecies(speciesId);
  const f: OwnedFriend = {
    uid: newUid(s, 'f'),
    speciesId,
    baseId: sp.baseId ?? sp.id,
    level: 1,
    exp: 0,
    affection: 0,
    obtainedAt: s.clock.gameTime,
    lastCare: {},
  };
  s.friends.push(f);
  markDex(s, speciesId, 'owned');
  if (s.team.length < MAX_TEAM) s.team.push(f.uid);
  return f;
}

/** 経験値を足して、レベルアップした回数を返す */
export function gainExpMut(f: OwnedFriend, amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  let ups = 0;
  if (f.level >= MAX_LEVEL) return 0;
  f.exp += Math.floor(amount);
  while (f.level < MAX_LEVEL && f.exp >= expToNext(f.level)) {
    f.exp -= expToNext(f.level);
    f.level += 1;
    ups += 1;
  }
  if (f.level >= MAX_LEVEL) f.exp = 0;
  return ups;
}

export function gainTeamExpMut(s: SaveData, amount: number): string[] {
  const leveled: string[] = [];
  for (const uid of s.team) {
    const f = getFriend(s, uid);
    if (f && gainExpMut(f, amount) > 0) leveled.push(f.uid);
  }
  return leveled;
}

function addAffection(f: OwnedFriend, n: number): void {
  f.affection = Math.max(0, Math.min(MAX_AFFECTION, f.affection + n));
}

/** お世話の待ち時間（ミリ秒）。連打しても すぐには上がらないが、短いので待たせすぎない */
export const CARE_COOLDOWN: Record<CareKind, number> = {
  feed: 0,
  pet: 15_000,
  play: 30_000,
  brush: 45_000,
  nap: 10 * 60_000,
};

export function careWait(f: OwnedFriend, kind: CareKind, now: number): number {
  const last = f.lastCare[kind];
  if (last === undefined) return 0;
  return Math.max(0, last + CARE_COOLDOWN[kind] - now);
}

export interface CareOutcome {
  affection: number;
  exp: number;
  leveled: boolean;
  favorite: boolean;
}

export function care(state: SaveData, uid: string, kind: CareKind, now: number, foodId?: string): Result {
  const s = clone(state);
  const f = getFriend(s, uid);
  if (!f) return fail('なかまが みつからないよ');
  const wait = careWait(f, kind, now);
  if (wait > 0) return fail(`いまは まんぞく しているみたい（あと ${Math.ceil(wait / 1000)}びょう）`);
  const sp = getSpecies(f.speciesId);
  let aff = 0;
  let exp = 0;
  let favorite = false;
  switch (kind) {
    case 'feed': {
      const food = foodId ? getFood(foodId) : undefined;
      if (!food) return fail('ごはんを えらんでね');
      if (!removeItemsMut(s, { [food.id]: 1 })) return fail(`${food.name}を もっていないよ`);
      favorite = sp.favoriteFood === food.id;
      aff = favorite ? 6 : 3;
      exp = food.exp + (favorite ? 5 : 0);
      break;
    }
    case 'pet':
      aff = 1;
      exp = 1;
      break;
    case 'play':
      aff = 2;
      exp = 3;
      break;
    case 'brush':
      aff = 3;
      exp = 2;
      break;
    case 'nap':
      aff = 2;
      exp = 2;
      break;
  }
  f.lastCare[kind] = now;
  addAffection(f, aff);
  const leveled = gainExpMut(f, exp) > 0;
  const outcome: CareOutcome = { affection: aff, exp, leveled, favorite };
  return ok(s, undefined, outcome);
}

/** げんきキャンディなど、アイテムで経験値をあげる */
export function giveExpCandy(state: SaveData, uid: string): Result {
  const s = clone(state);
  const f = getFriend(s, uid);
  if (!f) return fail('なかまが みつからないよ');
  if (f.level >= MAX_LEVEL) return fail('もう いちばん つよいよ');
  if (!removeItemsMut(s, { expcandy: 1 })) return fail(`${getItem('expcandy')?.name}を もっていないよ`);
  const ups = gainExpMut(f, 30);
  return ok(s, ups > 0 ? `レベルが ${f.level} に あがった！` : 'けいけんちが 30 ふえた！');
}

// ---------- 進化 ----------

export interface EvoCheck {
  to: string;
  level: boolean;
  affection: boolean;
  items: boolean;
  ready: boolean;
}

export function evolutionChecks(s: SaveData, f: OwnedFriend): EvoCheck[] {
  const base = getSpecies(f.baseId);
  // すでに進化している時も、ほかの進化先を選び直せるように 基本の すがた の進化先を出す
  return base.evolutions
    .filter((e) => e.to !== f.speciesId)
    .map((e) => {
      const level = f.level >= e.level;
      const affection = f.affection >= e.affection;
      const items = hasItems(s, e.items);
      return { to: e.to, level, affection, items, ready: level && affection && items };
    });
}

export function evolve(state: SaveData, uid: string, to: string): Result {
  const s = clone(state);
  const f = getFriend(s, uid);
  if (!f) return fail('なかまが みつからないよ');
  const base = getSpecies(f.baseId);
  const evo = base.evolutions.find((e) => e.to === to);
  if (!evo) return fail('その すがたには しんか できないよ');
  if (f.speciesId === to) return fail('もう その すがただよ');
  if (f.level < evo.level) return fail(`レベル ${evo.level} に なったら しんか できるよ`);
  if (f.affection < evo.affection) return fail(`なかよしど ${evo.affection} に なったら しんか できるよ`);
  if (!removeItemsMut(s, evo.items)) return fail('しんかに ひつような そざいが たりないよ');
  markDex(s, f.speciesId, 'owned'); // 進化前の姿も図鑑に残す
  f.speciesId = to;
  markDex(s, to, 'owned');
  s.stats.evolutions += 1;
  return ok(s, `${getSpecies(to).name}に しんかした！`);
}

/** 進化前の姿に戻す（とりかえしの つかない えらびかたに しないため）。素材は戻らない */
export function revertEvolution(state: SaveData, uid: string): Result {
  const s = clone(state);
  const f = getFriend(s, uid);
  if (!f) return fail('なかまが みつからないよ');
  if (f.speciesId === f.baseId) return fail('もう もとの すがただよ');
  f.speciesId = f.baseId;
  return ok(s, `${getSpecies(f.baseId).name}の すがたに もどった`);
}

// ---------- チーム ----------

export function setTeam(state: SaveData, uids: string[]): Result {
  const unique = [...new Set(uids)];
  if (unique.length > MAX_TEAM) return fail(`チームは ${MAX_TEAM}にん までだよ`);
  if (unique.some((u) => !state.friends.some((f) => f.uid === u))) return fail('なかまが みつからないよ');
  const s = clone(state);
  s.team = unique;
  return ok(s);
}

export function toggleTeam(state: SaveData, uid: string): Result {
  if (state.team.includes(uid)) return setTeam(state, state.team.filter((u) => u !== uid));
  if (state.team.length >= MAX_TEAM) return fail(`チームは ${MAX_TEAM}にん までだよ。だれかを はずしてね`);
  return setTeam(state, [...state.team, uid]);
}

export function teamAbilities(s: SaveData): Map<Ability, OwnedFriend> {
  const map = new Map<Ability, OwnedFriend>();
  for (const uid of s.team) {
    const f = getFriend(s, uid);
    if (!f) continue;
    for (const a of friendAbilities(f)) if (!map.has(a)) map.set(a, f);
  }
  return map;
}

/** 素材で なかまに よびかける */
export function craftFriend(state: SaveData, speciesId: string): Result {
  const sp = getSpecies(speciesId);
  if (!sp.craft) return fail('この なかまは そざいでは よべないよ');
  const s = clone(state);
  if (!removeItemsMut(s, sp.craft)) return fail('そざいが たりないよ');
  const f = addFriendMut(s, speciesId);
  return ok(s, `${sp.name}が なかまに なった！`, f.uid);
}

/** さいしょの なかま（さくらん）を受け取る。二重に受け取れない */
export function receiveStarter(state: SaveData): Result {
  if (state.friends.length > 0) return fail('もう なかまが いるよ');
  const s = clone(state);
  const f = addFriendMut(s, 'sakuran');
  return ok(s, 'さくらんが なかまに なった！', f.uid);
}

export function renameFriend(state: SaveData, uid: string, nickname: string): Result {
  const s = clone(state);
  const f = getFriend(s, uid);
  if (!f) return fail('なかまが みつからないよ');
  const name = nickname.trim().slice(0, 8);
  f.nickname = name || undefined;
  return ok(s);
}

export function displayName(f: OwnedFriend): string {
  return f.nickname || getSpecies(f.speciesId).name;
}
