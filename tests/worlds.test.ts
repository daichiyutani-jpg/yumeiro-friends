import { describe, expect, it } from 'vitest';
import { WORLDS, getOutfit } from '../src/game/data/catalog';
import { getItem } from '../src/game/data/items';
import { WORLD_MAPS, getWorldMap } from '../src/game/data/maps';
import { MORE_WORLDS, SWEETS } from '../src/game/data/moreWorlds';
import { hasSpecies } from '../src/game/data/species';
import { befriend, chestsToUnlock, checkSwitchOrder, forestProgress, isWorldUnlocked, openChest, solvePuzzle } from '../src/game/logic/adventure';
import { createNewSave } from '../src/game/logic/core';
import { addFriendMut } from '../src/game/logic/friends';
import { sellItem, sellPrice } from '../src/game/logic/shop';
import { resolveMove } from '../src/game/forestLayout';
import { themeLayout } from '../src/game/themeLayout';
import type { SaveData } from '../src/game/types';

const T0 = 1_800_000_000_000;
function fresh(): SaveData {
  const s = createNewSave({ name: 'テスト', hairStyle: 'twin', hairColor: '#000', eyeColor: '#000', skinColor: '#fff' }, T0);
  addFriendMut(s, 'sakuran');
  s.team = [s.friends[0].uid];
  return s;
}
function must<T>(r: { ok: true; state: T } | { ok: false; reason: string }): T {
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}
/** ワールドの たからばこを n こ あけた ことに する */
function openN(s: SaveData, worldId: string, n: number): SaveData {
  const m = getWorldMap(worldId);
  s.forest.openedChests.push(...m.chests.slice(0, n).map((c) => c.id));
  return s;
}

describe('あたらしい ぼうけん先（5か所）', () => {
  it('7つ すべて あそべて、マップが ある', () => {
    expect(WORLDS.every((w) => w.implemented)).toBe(true);
    expect(WORLD_MAPS.map((m) => m.id).sort()).toEqual(WORLDS.map((w) => w.id).sort());
  });

  it('ID は すべての ワールドで かさならない・ごほうび・ふく・なかま・おみやげが ある', () => {
    const ids = WORLD_MAPS.flatMap((m) => [...m.chests, ...m.puzzles, ...m.encounters, ...m.pickups, ...m.switches].map((x) => x.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of MORE_WORLDS) {
      for (const c of m.chests) {
        for (const k of Object.keys(c.reward)) if (k !== 'coins') expect(getItem(k), k).toBeTruthy();
        if (c.outfit) expect(getOutfit(c.outfit), c.outfit).toBeTruthy();
        if (c.lockedBy) expect(m.puzzles.some((p) => p.id === c.lockedBy)).toBe(true);
      }
      for (const e of m.encounters) {
        expect(hasSpecies(e.species), e.species).toBe(true);
        expect(getItem(e.gift!.item)?.price, e.gift!.item).toBeDefined();
      }
      for (const p of m.pickups) expect(getItem(p.item), p.item).toBeTruthy();
      for (const p of m.puzzles) if (p.alt) expect(getItem(p.alt.item)).toBeTruthy();
      expect(m.switchOrder.every((id) => m.switches.some((w) => w.id === id))).toBe(true);
    }
  });

  it('まえの ワールドで たからばこを 4こ あけると つぎへ いける（じゅんばん）', () => {
    let s = fresh();
    const chain = ['sea', 'sweets', 'starisland', 'garden', 'castle', 'mystery'];
    expect(isWorldUnlocked(s, 'sakura')).toBe(true);
    expect(isWorldUnlocked(s, 'sweets')).toBe(false);
    expect(chestsToUnlock(s, 'sweets')).toBe(4);
    s = openN(s, 'sakura', 3);
    for (let i = 1; i < chain.length; i++) {
      expect(isWorldUnlocked(s, chain[i])).toBe(false);
      s = openN(s, chain[i - 1], 4);
      expect(isWorldUnlocked(s, chain[i])).toBe(true);
    }
  });

  it('3つめ いこうは むずかしく なる（レベル・そざいの かず・スイッチの かず が ふえる）', () => {
    const tiers = MORE_WORLDS.map((m) => m.tier!);
    expect(tiers).toEqual([1, 2, 3, 4, 5]);
    const lv = MORE_WORLDS.map((m) => m.puzzles.find((p) => p.ability)!.minLevel!);
    const alt = MORE_WORLDS.map((m) => m.puzzles.find((p) => p.ability)!.alt!.count);
    for (let i = 1; i < 5; i++) {
      expect(lv[i]).toBeGreaterThan(lv[i - 1]);
      expect(alt[i]).toBeGreaterThan(alt[i - 1]);
    }
    expect(lv[0]).toBeGreaterThan(1);
    expect(getWorldMap('sakura').puzzles.every((p) => !p.minLevel)).toBe(true);
    expect(getWorldMap('sea').puzzles.every((p) => !p.minLevel)).toBe(true);
    expect(MORE_WORLDS.map((m) => m.switches.length)).toEqual([4, 4, 5, 5, 5]);
    expect(getWorldMap('sakura').switches.length).toBe(3);
  });

  it('レベルが たりない なかまでは とけない。レベルが あがれば とける。そざいでも とける', () => {
    let s = fresh();
    const p = SWEETS.puzzles.find((x) => x.ability === 'flower')!;
    const f = s.friends[0];
    const r = solvePuzzle(s, p.id, { kind: 'ability', friendUid: f.uid });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toContain(`レベル ${p.minLevel}`);
    s.friends[0].level = p.minLevel!;
    s = must(solvePuzzle(s, p.id, { kind: 'ability', friendUid: f.uid }));
    expect(s.forest.solvedPuzzles).toContain(p.id);

    let t = fresh();
    const q = SWEETS.puzzles.find((x) => x.ability === 'water')!;
    expect(solvePuzzle(t, q.id, { kind: 'item' }).ok).toBe(false);
    t.items[q.alt!.item] = q.alt!.count;
    t = must(solvePuzzle(t, q.id, { kind: 'item' }));
    expect(t.items[q.alt!.item]).toBeUndefined();
    const chest = SWEETS.chests.find((c) => c.lockedBy === q.id)!;
    t = must(openChest(t, chest.id));
    expect(forestProgress(t, 'sweets').chests).toBe(1);
  });

  it('なかまに さそうには おみやげが いる（へる）', () => {
    let s = fresh();
    const e = SWEETS.encounters[0];
    delete s.items[e.gift!.item];
    expect(befriend(s, e.id).ok).toBe(false);
    s.items[e.gift!.item] = e.gift!.count + 1;
    s = must(befriend(s, e.id));
    expect(s.items[e.gift!.item]).toBe(1);
    expect(s.friends.some((f) => f.speciesId === e.species)).toBe(true);
  });

  it('スイッチの じゅんばん・とけた あとは ふくが もらえる', () => {
    for (const m of MORE_WORLDS) {
      expect(checkSwitchOrder(m.switchOrder, m)).toBe('ok');
      expect(checkSwitchOrder([...m.switchOrder].reverse(), m)).toBe('wrong');
    }
    let s = fresh();
    s = must(solvePuzzle(s, SWEETS.switchPuzzle, { kind: 'switch' }));
    s = must(openChest(s, SWEETS.chests.find((c) => c.lockedBy === SWEETS.switchPuzzle)!.id));
    expect(s.ownedOutfits).toContain('acc_lolli');
  });

  it('だいじな ばしょは かざりや めじるしに ふさがれず、しかけは とくまで とおれない', () => {
    for (const m of MORE_WORLDS) {
      const L = themeLayout(m);
      const spots = [m.spawn, m.portal, m.sign, ...m.chests, ...m.switches, ...m.pickups, ...m.encounters];
      for (const k of spots) {
        for (const c of L.colliders) {
          if (c.until) continue;
          expect(Math.hypot(c.x - k.x, c.z - k.z), `${m.id} ${JSON.stringify(k)}`).toBeGreaterThan(c.r + 0.4);
        }
      }
      const p = m.puzzles.find((x) => x.ability)!;
      const blocked = resolveMove(p.x + 0.2, p.z, 0.3, [], m.id);
      expect(Math.hypot(blocked.x - p.x, blocked.z - p.z)).toBeGreaterThan(1.3);
      const open = resolveMove(p.x + 0.2, p.z, 0.3, [p.id], m.id);
      expect(Math.hypot(open.x - p.x - 0.2, open.z - p.z)).toBeLessThan(0.01);
    }
  });
});

describe('アイテムを うる', () => {
  it('かった ねだんの はんぶんで うれる・そざいも うれる・どうぐは うれない', () => {
    expect(sellPrice('cookie')).toBe(5);
    expect(sellPrice('star')).toBe(8);
    expect(sellPrice('lantern')).toBeUndefined();
    let s = fresh();
    const coins = s.coins;
    s.items.star = 3;
    s = must(sellItem(s, 'star', 2));
    expect(s.items.star).toBe(1);
    expect(s.coins).toBe(coins + 16);
  });
  it('もっていない かず・どうぐ・へんな かずは うれない（なにも かわらない）', () => {
    const s = fresh();
    s.items.lantern = 1;
    expect(sellItem(s, 'cookie', 99).ok).toBe(false);
    expect(sellItem(s, 'lantern', 1).ok).toBe(false);
    expect(sellItem(s, 'cookie', 0).ok).toBe(false);
    expect(sellItem(s, 'cookie', 1.5).ok).toBe(false);
    expect(sellItem(s, 'nope', 1).ok).toBe(false);
  });
});
