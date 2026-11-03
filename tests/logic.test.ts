import { describe, expect, it } from 'vitest';
import { EGGS, getOutfit } from '../src/game/data/catalog';
import { FOREST } from '../src/game/data/forest';
import { BASE_SPECIES, SPECIES, getSpecies } from '../src/game/data/species';
import { FOODS, SEEDS, getItem } from '../src/game/data/items';
import { addItems, createNewSave, removeItems } from '../src/game/logic/core';
import {
  addFriendMut, care, craftFriend, evolutionChecks, evolve, expToNext, gainExpMut, revertEvolution, toggleTeam,
} from '../src/game/logic/friends';
import {
  buyEgg, collectHelpers, eggOdds, harvest, hatchEgg, placeFurniture, plant, plotStatus, rollEgg, storeFurniture, moveFurniture, toggleHelper, HELPER_INTERVAL,
  ownsSurface, rotateFurniture, setSurface, ROOM_WALL,
} from '../src/game/logic/life';
import { befriend, checkSwitchOrder, forestProgress, isWorldUnlocked, openChest, pickUp, solvePuzzle } from '../src/game/logic/adventure';
import { SEA } from '../src/game/data/sea';
import { buyFurniture, buyItem, canTransform, craftOutfit, equip, finishMinigame, transform } from '../src/game/logic/shop';
import { advanceClock, MAX_JUMP } from '../src/game/logic/time';
import { advanceTutorial } from '../src/game/logic/tutorial';
import type { SaveData } from '../src/game/types';

const T0 = 1_800_000_000_000;
const MIN = 60_000;

function fresh(): SaveData {
  const s = createNewSave({ name: 'テスト', hairStyle: 'twin', hairColor: '#000', eyeColor: '#000', skinColor: '#fff' }, T0);
  addFriendMut(s, 'sakuran');
  return s;
}
function must<T>(r: { ok: true; state: T } | { ok: false; reason: string }): T {
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}

describe('データ定義', () => {
  it('基本の なかまが12しゅるい以上あり、全員が必要な情報を持つ', () => {
    expect(BASE_SPECIES.length).toBeGreaterThanOrEqual(12);
    for (const s of SPECIES) {
      expect(s.name && s.description && s.personality && s.skills.length).toBeTruthy();
      expect(getItem(s.favoriteFood)).toBeTruthy();
      for (const e of s.evolutions) {
        expect(getSpecies(e.to).baseId).toBe(s.id);
        for (const id of Object.keys(e.items)) expect(getItem(id)).toBeTruthy();
      }
    }
  });
  it('卵の確率の合計は1で、レアリティごとに候補がいる', () => {
    for (const egg of EGGS) {
      expect(egg.rates[1] + egg.rates[2] + egg.rates[3]).toBeCloseTo(1, 6);
      const total = eggOdds(egg).reduce((a, b) => a + b.rate, 0);
      expect(total).toBeCloseTo(1, 6);
    }
  });
  it('森の宝箱の鍵になっている謎解きは存在する', () => {
    for (const c of FOREST.chests) if ('lockedBy' in c && c.lockedBy) expect(FOREST.puzzles.some((p) => p.id === c.lockedBy)).toBe(true);
  });
  it('能力が必要な謎解きには、能力が無くても解ける方法があり、その道具はお店で買える', () => {
    for (const p of FOREST.puzzles) {
      if (!p.ability) continue;
      expect(p.alt).toBeTruthy();
      const item = getItem(p.alt!.item)!;
      expect(item.price !== undefined || item.category === 'material').toBe(true);
    }
  });
});

describe('アイテムと コイン', () => {
  it('増やす・減らすが正しく、足りない時は何も変わらない', () => {
    let s = fresh();
    s = must(addItems(s, { petal: 3, coins: 50 }));
    expect(s.items.petal).toBe(3);
    expect(s.coins).toBe(250);
    const r = removeItems(s, { petal: 2, star: 1 });
    expect(r.ok).toBe(false);
    expect(s.items.petal).toBe(3);
    s = must(removeItems(s, { petal: 3, coins: 250 }));
    expect(s.items.petal).toBeUndefined();
    expect(s.coins).toBe(0);
  });
  it('マイナスや小数の指定は受け付けない', () => {
    const s = fresh();
    expect(removeItems(s, { cookie: -5 }).ok).toBe(false);
    const s2 = must(addItems(s, { cookie: -5, petal: 1.5 }));
    expect(s2.items.cookie).toBe(5);
    expect(s2.items.petal).toBeUndefined();
  });
  it('コインが足りないと買えない', () => {
    const s = fresh();
    s.coins = 5;
    expect(buyItem(s, 'cookie', 1).ok).toBe(false);
    s.coins = 30;
    const s2 = must(buyItem(s, 'cookie', 3));
    expect(s2.coins).toBe(0);
    expect(s2.items.cookie).toBe(8);
  });
});

describe('なかまの 育成', () => {
  it('経験値が正しく増え、レベルアップする', () => {
    const s = fresh();
    const f = s.friends[0];
    expect(gainExpMut(f, expToNext(1) - 1)).toBe(0);
    expect(f.level).toBe(1);
    expect(gainExpMut(f, 1)).toBe(1);
    expect(f.level).toBe(2);
    expect(f.exp).toBe(0);
    gainExpMut(f, expToNext(2) + expToNext(3) + 5);
    expect(f.level).toBe(4);
    expect(f.exp).toBe(5);
  });
  it('ごはん・なでる で仲良し度が上がり、好物はたくさん上がる。ごはんは減る', () => {
    let s = fresh();
    const uid = s.friends[0].uid;
    s = must(care(s, uid, 'feed', T0, 'strawberry')); // 好物
    expect(s.friends[0].affection).toBe(6);
    expect(s.items.strawberry).toBe(1);
    s = must(care(s, uid, 'feed', T0, 'cookie'));
    expect(s.friends[0].affection).toBe(9);
    s = must(care(s, uid, 'pet', T0));
    expect(s.friends[0].affection).toBe(10);
    // なでる の すぐ後は待ち時間（失敗しても何も減らない）
    expect(care(s, uid, 'pet', T0 + 1000).ok).toBe(false);
    expect(care(s, uid, 'pet', T0 + 16_000).ok).toBe(true);
  });
  it('持っていない ごはんは あげられない', () => {
    const s = fresh();
    expect(care(s, s.friends[0].uid, 'feed', T0, 'pudding').ok).toBe(false);
  });
  it('仲良し度は時間がたっても下がらない（時間で減らす処理が無い）', () => {
    let s = fresh();
    s = must(care(s, s.friends[0].uid, 'play', T0));
    const aff = s.friends[0].affection;
    s = advanceClock(s, T0 + 10 * 24 * 60 * MIN);
    expect(s.friends[0].affection).toBe(aff);
  });
});

describe('進化', () => {
  it('条件（レベル・仲良し度・素材）を正しく判定し、素材を消費して進化する', () => {
    let s = fresh();
    const uid = s.friends[0].uid;
    expect(evolve(s, uid, 'hanasakuran').ok).toBe(false); // レベル不足
    s.friends[0].level = 5;
    expect(evolve(s, uid, 'hanasakuran').ok).toBe(false); // 仲良し度不足
    s.friends[0].affection = 20;
    expect(evolve(s, uid, 'hanasakuran').ok).toBe(false); // 素材不足
    expect(evolutionChecks(s, s.friends[0]).find((c) => c.to === 'hanasakuran')).toMatchObject({ level: true, affection: true, items: false });
    s.items.petal = 6;
    s = must(evolve(s, uid, 'hanasakuran'));
    expect(s.friends[0].speciesId).toBe('hanasakuran');
    expect(s.items.petal).toBe(1);
    expect(s.dex.sakuran).toBe('owned'); // 進化前も図鑑に残る
    expect(s.dex.hanasakuran).toBe('owned');
  });
  it('分岐進化: 別の素材で別の姿になり、元に戻して選び直せる', () => {
    let s = fresh();
    const uid = s.friends[0].uid;
    s.friends[0].level = 5;
    s.friends[0].affection = 20;
    s.items.star = 3;
    s = must(evolve(s, uid, 'hoshisakuran'));
    expect(s.friends[0].speciesId).toBe('hoshisakuran');
    s = must(revertEvolution(s, uid));
    expect(s.friends[0].speciesId).toBe('sakuran');
    expect(s.friends[0].level).toBe(5); // レベルは そのまま
    s.items.shell = 3;
    s = must(evolve(s, uid, 'namisakuran'));
    expect(s.friends[0].speciesId).toBe('namisakuran');
  });
  it('ほかの なかまの進化先には進化できない', () => {
    const s = fresh();
    s.friends[0].level = 30;
    s.friends[0].affection = 100;
    s.items.star = 99;
    expect(evolve(s, s.friends[0].uid, 'nagarekon').ok).toBe(false);
  });
});

describe('卵', () => {
  it('お金が足りないと買えず、時間がたつと孵化して図鑑と所持に反映される', () => {
    let s = fresh();
    s.coins = 100;
    expect(buyEgg(s, 'egg_sakura', T0).ok).toBe(false);
    s.coins = 500;
    s = must(buyEgg(s, 'egg_sakura', T0));
    expect(s.coins).toBe(380);
    const egg = s.eggs[0];
    expect(hatchEgg(s, egg.uid, T0 + 2 * MIN, () => 0).ok).toBe(false);
    const r = hatchEgg(s, egg.uid, T0 + 3 * MIN, () => 0);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.eggs.length).toBe(0);
    expect(r.state.friends.length).toBe(2);
    const born = r.state.friends[1];
    expect(getSpecies(born.speciesId).rarity).toBe(1);
    expect(r.state.dex[born.speciesId]).toBe('owned');
  });
  it('乱数の値でレアリティが決まる', () => {
    const egg = EGGS[0];
    expect(getSpecies(rollEgg(egg, () => 0.1)).rarity).toBe(1);
    const seq = [0.8, 0];
    expect(getSpecies(rollEgg(egg, () => seq.shift()!)).rarity).toBe(2);
    const seq3 = [0.99, 0.5];
    expect(getSpecies(rollEgg(egg, () => seq3.shift()!)).rarity).toBe(3);
  });
  it('たくさん引くと確率はおおよそ表示どおり', () => {
    let seed = 42;
    const rng = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const egg = EGGS[1];
    const counts = { 1: 0, 2: 0, 3: 0 } as Record<number, number>;
    for (let i = 0; i < 20000; i++) counts[getSpecies(rollEgg(egg, rng)).rarity]++;
    expect(counts[1] / 20000).toBeCloseTo(egg.rates[1], 1);
    expect(counts[3] / 20000).toBeCloseTo(egg.rates[3], 1);
  });
});

describe('花壇', () => {
  it('植える → 成長 → 収穫 で素材が増える', () => {
    let s = fresh();
    const seed = SEEDS.find((x) => x.id === 'seed_sakura')!;
    expect(plotStatus(s, 0, T0)).toBe('empty');
    s = must(plant(s, 0, 'seed_sakura', T0));
    expect(s.items.seed_sakura).toBe(1);
    expect(plotStatus(s, 0, T0)).toBe('seed');
    expect(plotStatus(s, 0, T0 + seed.growMinutes * MIN * 0.6)).toBe('growing');
    expect(harvest(s, 0, T0 + MIN).ok).toBe(false);
    expect(plant(s, 0, 'seed_sakura', T0).ok).toBe(false); // 同じ花壇に二重に植えない
    s = must(harvest(s, 0, T0 + seed.growMinutes * MIN));
    expect(s.items.petal).toBe(3);
    expect(plotStatus(s, 0, T0)).toBe('empty');
  });
});

describe('おうちづくり', () => {
  it('家具を置く・動かす・しまう。へやの外には置けない', () => {
    let s = fresh();
    const r = placeFurniture(s, 'chair', 100, -100);
    s = must(r);
    const p = s.town.placed[0];
    expect(p.x).toBe(4.5);
    expect(p.z).toBe(-4.5);
    expect(s.town.furniture.chair).toBeUndefined();
    expect(placeFurniture(s, 'chair', 0, 0).ok).toBe(false); // もう しまってある いすが無い
    s = must(moveFurniture(s, p.uid, 1.2, 2.9));
    expect(s.town.placed[0]).toMatchObject({ x: 1, z: 3 });
    s = must(storeFurniture(s, p.uid));
    expect(s.town.placed.length).toBe(0);
    expect(s.town.furniture.chair).toBe(1);
  });
  it('かべの かざりは かべにだけ かけられ、かべに そって うごく', () => {
    let s = fresh();
    expect(placeFurniture(s, 'frame', 1, 1).ok).toBe(false); // ゆかには おけない
    expect(placeFurniture(s, 'chair', 1, 1, 'back').ok).toBe(false); // かぐは かべに かけない
    s = must(placeFurniture(s, 'frame', 9, 3, 'back'));
    const p = s.town.placed[0];
    expect(p).toMatchObject({ wall: 'back', x: 4.5, z: -ROOM_WALL });
    s = must(moveFurniture(s, p.uid, 0, 1.3, 'left'));
    expect(s.town.placed[0]).toMatchObject({ wall: 'left', x: -ROOM_WALL, z: 1.5 });
    expect(rotateFurniture(s, p.uid).ok).toBe(false);
  });
  it('かべがみ・ゆかは もっている物だけ はりかえられ、なくならない', () => {
    let s = fresh();
    expect(s.town.wallpaper).toBe('wp_cream');
    expect(setSurface(s, 'wp_stripe').ok).toBe(false);
    s.coins = 1000;
    s = must(buyFurniture(s, 'wp_stripe'));
    expect(buyFurniture(s, 'wp_stripe').ok).toBe(false); // 2まいめは かえない
    s = must(setSurface(s, 'wp_stripe'));
    expect(s.town.wallpaper).toBe('wp_stripe');
    s = must(setSurface(s, 'wp_cream'));
    expect(s.town.wallpaper).toBe('wp_cream');
    expect(ownsSurface(s, 'wp_stripe')).toBe(true);
    expect(placeFurniture(s, 'wp_stripe', 0, 0).ok).toBe(false);
    expect(setSurface(s, 'chair').ok).toBe(false);
  });
  it('おてつだいは時間で素材を見つけ、上限がある', () => {
    let s = fresh();
    s = must(toggleHelper(s, s.friends[0].uid, T0));
    expect(collectHelpers(s, T0 + MIN, () => 0).ok).toBe(false);
    const r = collectHelpers(s, T0 + 100 * HELPER_INTERVAL, () => 0);
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.values(r.data as Record<string, number>).reduce((a, b) => a + b, 0)).toBe(6);
  });
});

describe('冒険', () => {
  it('宝箱を開けると報酬と経験値が入り、二回は開けられない', () => {
    let s = fresh();
    const coins = s.coins;
    s = must(openChest(s, 'c_start'));
    expect(s.coins).toBe(coins + 50);
    expect(s.friends[0].exp).toBeGreaterThan(0);
    expect(openChest(s, 'c_start').ok).toBe(false);
  });
  it('謎解き前の宝箱は開けられず、仲間の能力で解くと開けられる', () => {
    let s = fresh();
    expect(openChest(s, 'c_flower').ok).toBe(false);
    s = must(solvePuzzle(s, 'p_flower', { kind: 'ability', friendUid: s.friends[0].uid }));
    s = must(openChest(s, 'c_flower'));
    expect(s.ownedOutfits).toContain('tiara_sakura');
  });
  it('能力の無い仲間では解けないが、道具で解ける', () => {
    let s = fresh();
    expect(solvePuzzle(s, 'p_cave', { kind: 'ability', friendUid: s.friends[0].uid }).ok).toBe(false);
    expect(solvePuzzle(s, 'p_cave', { kind: 'item' }).ok).toBe(false);
    s.coins = 1000;
    s = must(buyItem(s, 'lantern'));
    s = must(solvePuzzle(s, 'p_cave', { kind: 'item' }));
    expect(s.items.lantern).toBe(1); // ランタンは なくならない
  });
  it('はなびらで つるの とびらを開けると、はなびらが減る', () => {
    let s = fresh();
    s.items.petal = 3;
    s = must(solvePuzzle(s, 'p_flower', { kind: 'item' }));
    expect(s.items.petal).toBeUndefined();
  });
  it('スイッチの順番', () => {
    expect(checkSwitchOrder(['sw_pink'])).toBe('continue');
    expect(checkSwitchOrder(['sw_pink', 'sw_blue'])).toBe('wrong');
    expect(checkSwitchOrder(['sw_pink', 'sw_yellow', 'sw_blue'])).toBe('ok');
  });
  it('森で出会った仲間を仲間にできるのは1回だけ', () => {
    let s = fresh();
    s = must(befriend(s, 'e_bear'));
    expect(s.friends.some((f) => f.speciesId === 'macaron')).toBe(true);
    expect(befriend(s, 'e_bear').ok).toBe(false);
  });
  it('落とし物は拾うと一定時間なくなり、また出てくる', () => {
    let s = fresh();
    s = must(pickUp(s, 'pk1', T0));
    expect(s.items.petal).toBe(1);
    expect(pickUp(s, 'pk1', T0 + MIN).ok).toBe(false);
    expect(pickUp(s, 'pk1', T0 + 11 * MIN).ok).toBe(true);
  });
  it('チームは3にんまで', () => {
    let s = fresh();
    addFriendMut(s, 'macaron');
    addFriendMut(s, 'awanya');
    const extra = addFriendMut(s, 'mokomoku');
    expect(s.team.length).toBe(3);
    expect(toggleTeam(s, extra.uid).ok).toBe(false);
    s = must(toggleTeam(s, s.team[0]));
    s = must(toggleTeam(s, extra.uid));
    expect(s.team).toContain(extra.uid);
  });
  it('素材で仲間を よびかけられる', () => {
    let s = fresh();
    expect(craftFriend(s, 'jewerisu').ok).toBe(false);
    s.items.star = 4;
    s.items.drop = 2;
    s = must(craftFriend(s, 'jewerisu'));
    expect(s.friends.some((f) => f.speciesId === 'jewerisu')).toBe(true);
    expect(s.items.star).toBeUndefined();
  });
});

describe('着せ替え・プリンセス', () => {
  it('持っている服だけ着られる', () => {
    let s = fresh();
    expect(equip(s, 'top', 'op_sakura').ok).toBe(false);
    s = must(equip(s, 'top', 'top_lav'));
    expect(s.equipped.top).toBe('top_lav');
    expect(equip(s, 'top', 'bt_shorts').ok).toBe(false); // ちがう場所
    expect(equip(s, 'top', null).ok).toBe(false);
  });
  it('ドレス・ティアラ・ガラスのくつ がそろうと変身できる', () => {
    let s = fresh();
    expect(canTransform(s)).toBe(false);
    s.items = { petal: 20, star: 20, drop: 20, cotton: 20 };
    s = must(craftOutfit(s, 'dress_yumeiro'));
    s = must(craftOutfit(s, 'sh_glass'));
    s = must(craftOutfit(s, 'tiara_moon'));
    expect(canTransform(s)).toBe(true);
    s = must(transform(s, true));
    expect(s.princess).toBe(true);
    expect(s.equipped.dress).toBe('dress_yumeiro');
    expect(s.equipped.shoes).toBe('sh_glass');
  });
});

describe('ミニゲーム', () => {
  it('スコアに応じた報酬が所持品に入る', () => {
    let s = fresh();
    const c = s.coins;
    s = must(finishMinigame(s, 12));
    expect(s.coins).toBe(c + 36);
    expect(s.items.petal).toBe(3);
    expect(s.stats.bestScore).toBe(12);
  });
});

describe('時間経過', () => {
  it('ふつうに時間が進む', () => {
    const s = fresh();
    const s2 = advanceClock(s, T0 + 5 * MIN);
    expect(s2.clock.gameTime - s.clock.gameTime).toBe(5 * MIN);
  });
  it('端末の時刻を戻してもゲーム内時刻は戻らない', () => {
    const s = advanceClock(fresh(), T0 - 60 * MIN);
    expect(s.clock.gameTime).toBe(T0);
    expect(s.clock.warned).toBe(true);
    const s2 = advanceClock(s, T0 - 59 * MIN);
    expect(s2.clock.gameTime).toBe(T0 + MIN);
  });
  it('極端に未来へ進めても MAX_JUMP までしか進まない', () => {
    const s = advanceClock(fresh(), T0 + 365 * 24 * 60 * MIN);
    expect(s.clock.gameTime).toBe(T0 + MAX_JUMP);
  });
});

describe('チュートリアル', () => {
  it('決まった順番の出来事で進み、関係ない出来事では進まない', () => {
    let s = fresh();
    expect(s.tutorial.step).toBe(1);
    s = advanceTutorial(s, 'chest');
    expect(s.tutorial.step).toBe(1);
    for (const e of ['fed', 'enterForest', 'moved', 'chest', 'puzzle', 'returnHome', 'planted', 'placed'] as const) s = advanceTutorial(s, e);
    expect(s.tutorial.done).toBe(true);
  });
});

describe('食べ物の定義', () => {
  it('すべての ごはんに値段と経験値がある', () => {
    for (const f of FOODS) expect(f.price! > 0 && f.exp > 0).toBe(true);
  });
});

describe('うみの せかい', () => {
  it('さくらの森で たからばこを 3こ あけると いけるように なる', () => {
    let s = fresh();
    expect(isWorldUnlocked(s, 'sakura')).toBe(true);
    expect(isWorldUnlocked(s, 'sea')).toBe(false);
    s = must(openChest(s, 'c_start'));
    s = must(solvePuzzle(s, 'p_flower', { kind: 'ability', friendUid: s.friends[0].uid }));
    s = must(openChest(s, 'c_flower'));
    expect(isWorldUnlocked(s, 'sea')).toBe(false);
    s.items.petal = 0;
    s.coins = 1000;
    s = must(buyItem(s, 'lantern'));
    s = must(solvePuzzle(s, 'p_cave', { kind: 'item' }));
    s = must(openChest(s, 'c_cave'));
    expect(isWorldUnlocked(s, 'sea')).toBe(true);
  });
  it('すすみぐあいは ワールドごとに かぞえる', () => {
    let s = fresh();
    s = must(openChest(s, 'cs_start'));
    expect(forestProgress(s, 'sea').chests).toBe(1);
    expect(forestProgress(s, 'sea').chestTotal).toBe(SEA.chests.length);
    expect(forestProgress(s, 'sakura').chests).toBe(0);
    expect(s.items.fishjelly).toBe(2);
  });
  it('しかけを とくと たからばこが あき、あたらしい ふくが もらえる', () => {
    let s = fresh();
    expect(openChest(s, 'cs_cove').ok).toBe(false);
    s.coins = 1000;
    s = must(buyItem(s, 'gloves'));
    s = must(solvePuzzle(s, 'ps_log', { kind: 'item' }));
    s = must(openChest(s, 'cs_cove'));
    expect(s.ownedOutfits).toContain('hat_straw');
  });
  it('わたの ふうせんで はなれじまへ。わたは へる', () => {
    let s = fresh();
    s.items.cotton = 3;
    s = must(solvePuzzle(s, 'ps_island', { kind: 'item' }));
    expect(s.items.cotton).toBeUndefined();
    s = must(openChest(s, 'cs_island'));
  });
  it('かいがらの じゅんばん（みずいろ → しろ → ピンク）', () => {
    expect(checkSwitchOrder(['sh_blue'], SEA)).toBe('continue');
    expect(checkSwitchOrder(['sh_pink'], SEA)).toBe('wrong');
    expect(checkSwitchOrder(['sh_blue', 'sh_white', 'sh_pink'], SEA)).toBe('ok');
    let s = fresh();
    s = must(solvePuzzle(s, 'ps_shells', { kind: 'switch' }));
    s = must(openChest(s, 'cs_shells'));
    expect(s.ownedOutfits).toContain('acc_shell');
  });
  it('うみで であった なかまを なかまに できる', () => {
    let s = fresh();
    s = must(befriend(s, 'es_pen'));
    expect(s.friends.some((f) => f.speciesId === 'yukipen')).toBe(true);
    expect(forestProgress(s, 'sea').friends).toBe(1);
  });
  it('うみの おとしものを ひろえる', () => {
    let s = fresh();
    s = must(pickUp(s, 'pks2', T0));
    expect(s.items.shell).toBe(2);
  });
  it('ID は ワールドを またいで かさならず、ごほうびの ふくや アイテムが ある', () => {
    const ids = [FOREST, SEA].flatMap((m) => [...m.chests, ...m.puzzles, ...m.encounters, ...m.pickups, ...m.switches].map((x) => x.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of SEA.chests) {
      for (const k of Object.keys(c.reward)) if (k !== 'coins') expect(getItem(k)).toBeTruthy();
      if (c.outfit) expect(getOutfit(c.outfit)).toBeTruthy();
    }
    for (const e of SEA.encounters) expect(getSpecies(e.species)).toBeTruthy();
  });
});
