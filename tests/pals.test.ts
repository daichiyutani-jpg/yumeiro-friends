import { describe, expect, it } from 'vitest';
import { SAVE_VERSION, createNewSave } from '../src/game/logic/core';
import { addFriendMut } from '../src/game/logic/friends';
import { migrate } from '../src/game/logic/migrate';
import { MAX_PALS, PAL_QR_PREFIX, addPal, decodePalCard, encodePalCard, isPalCode, removePal } from '../src/game/logic/pals';
import type { SaveData } from '../src/game/types';

const look = { name: 'ゆめ', hairStyle: 'twin' as const, hairColor: '#b98cff', eyeColor: '#2f7fbf', skinColor: '#ffe8d9' };
const T = 1_000_000;

function mine(): SaveData {
  const s = createNewSave(look, T);
  addFriendMut(s, 'sakuran');
  s.team = [s.friends[0].uid];
  s.town.placed = [
    { uid: 'p1', furnitureId: 'sofa', x: 0, z: -3.5, rot: 1 },
    { uid: 'p2', furnitureId: 'window', x: -1, z: -5, rot: 0, wall: 'back' },
  ];
  return s;
}

function other(name = 'みみ'): SaveData {
  const s = createNewSave({ ...look, name }, T);
  addFriendMut(s, 'yukipen');
  return s;
}

describe('QRコードの ともだちとうろく', () => {
  it('ともだちコードは 8もじで、ひとりずつ ちがう', () => {
    const a = createNewSave(look, T);
    const b = createNewSave(look, T);
    expect(isPalCode(a.palCode)).toBe(true);
    expect(a.palCode).not.toBe(b.palCode);
  });

  it('QR の もじれつから すがた・チーム・おうちが もどる', () => {
    const s = mine();
    const text = encodePalCard(s);
    expect(text.startsWith(PAL_QR_PREFIX)).toBe(true);
    const card = decodePalCard(text, T)!;
    expect(card.code).toBe(s.palCode);
    expect(card.player).toEqual(s.player);
    expect(card.equipped).toEqual(s.equipped);
    expect(card.friends.map((f) => f.speciesId)).toEqual(['sakuran']);
    expect(card.placed).toMatchObject([
      { furnitureId: 'sofa', x: 0, z: -3.5, rot: 1 },
      { furnitureId: 'window', x: -1, wall: 'back' },
    ]);
    expect(card.wallpaper).toBe(s.town.wallpaper);
  });

  it('かぐを 40こ おいても QR に はいる おおきさ', () => {
    const s = mine();
    s.town.placed = Array.from({ length: 40 }, (_, i) => ({ uid: `p${i}`, furnitureId: 'chair', x: (i % 9) - 4, z: Math.floor(i / 9) - 4, rot: i % 4 }));
    const bytes = new TextEncoder().encode(encodePalCard(s)).length;
    expect(bytes).toBeLessThan(900);
    expect(decodePalCard(encodePalCard(s), T)!.placed).toHaveLength(40);
  });

  it('ゆめいろフレンズ いがいの QR・こわれた QR は よまない', () => {
    expect(decodePalCard('https://example.com', T)).toBeNull();
    expect(decodePalCard(`${PAL_QR_PREFIX}{oops`, T)).toBeNull();
    expect(decodePalCard(`${PAL_QR_PREFIX}{"c":"ABC","n":"x"}`, T)).toBeNull();
    expect(decodePalCard(`${PAL_QR_PREFIX}{"c":"ABCDEFGH","n":"  "}`, T)).toBeNull();
  });

  it('しらない ふく・かぐ・へんな いろ・ながい なまえ は なおす', () => {
    const text = PAL_QR_PREFIX + JSON.stringify({
      c: 'ABCDEFGH',
      n: 'ながいながいなまえです‮!',
      h: ['mohawk', 'red;background:url(x)', '#123', '#abcdef'],
      e: ['hat_flower', 'nope', '', '', '', '', ''],
      t: ['sakuran', 'dragon_xx', 'yukipen', 'awanya', 'ribowan'],
      w: 'fl_wood',
      f: 'fl_cloud',
      p: 'sofa:100:-100:9;unknown:0:0:0;wp_star:0:0:0;frame:3:2:0:l',
    });
    const c = decodePalCard(text, T)!;
    expect([...c.player.name]).toHaveLength(8);
    expect(c.player.name).not.toContain('‮');
    expect(c.player.hairStyle).toBe('long');
    expect(c.player.hairColor).toBe('#8a5a44');
    expect(c.player.eyeColor).toBe('#123');
    expect(c.equipped.top).toBe('top_pink'); // ぼうしは top に きられない
    expect(c.friends.map((f) => f.speciesId)).toEqual(['sakuran', 'yukipen', 'awanya']);
    expect(c.wallpaper).not.toBe('fl_wood');
    expect(c.flooring).toBe('fl_cloud');
    expect(c.placed.map((p) => p.furnitureId)).toEqual(['sofa', 'frame']);
    expect(Math.abs(c.placed[0].x)).toBeLessThanOrEqual(5);
    expect(c.placed[0].rot).toBe(3);
    expect(c.placed[1].wall).toBe('left');
  });

  it('とうろく・もういちど よむと あたらしく なる・はずす', () => {
    let s = mine();
    const o = other();
    const r = addPal(s, decodePalCard(encodePalCard(o), T)!, T + 1);
    expect(r.ok).toBe(true);
    s = (r as { state: SaveData }).state;
    expect(s.pals).toHaveLength(1);
    o.player.name = 'みみちゃん';
    const r2 = addPal(s, decodePalCard(encodePalCard(o), T)!, T + 2);
    s = (r2 as { state: SaveData }).state;
    expect(s.pals).toHaveLength(1);
    expect(s.pals[0].player.name).toBe('みみちゃん');
    expect(s.pals[0].addedAt).toBe(T + 1);
    const r3 = removePal(s, o.palCode);
    expect(r3.ok && r3.state.pals).toHaveLength(0);
  });

  it('じぶんの QR は とうろく できない・人数には さいだいが ある', () => {
    const s = mine();
    expect(addPal(s, decodePalCard(encodePalCard(s), T)!, T).ok).toBe(false);
    let t = s;
    for (let i = 0; i < MAX_PALS; i++) {
      const r = addPal(t, decodePalCard(encodePalCard(other()), T)!, T);
      t = (r as { state: SaveData }).state;
    }
    expect(t.pals).toHaveLength(MAX_PALS);
    expect(addPal(t, decodePalCard(encodePalCard(other()), T)!, T).ok).toBe(false);
  });

  it('まえの バージョン（v3）の セーブを よむと コードが できて、ともだちは からっぽ', () => {
    const old = JSON.parse(JSON.stringify(mine())) as Record<string, unknown>;
    old.version = 3;
    delete old.palCode;
    delete old.pals;
    const s = migrate(old);
    expect(s.version).toBe(SAVE_VERSION);
    expect(isPalCode(s.palCode)).toBe(true);
    expect(s.pals).toEqual([]);
  });

  it('セーブの よみこみで ともだちと コードが のこり、おかしな ものは きえる', () => {
    let s = mine();
    s = (addPal(s, decodePalCard(encodePalCard(other()), T)!, T) as { state: SaveData }).state;
    const raw = JSON.parse(JSON.stringify(s)) as SaveData & { pals: unknown[] };
    raw.pals.push({ code: 'bad' }, { ...raw.pals[0] }, { ...raw.pals[0], code: s.palCode });
    const loaded = migrate(raw);
    expect(loaded.palCode).toBe(s.palCode);
    expect(loaded.pals).toHaveLength(1);
    expect(loaded.pals[0]).toEqual(s.pals[0]);
  });
});
