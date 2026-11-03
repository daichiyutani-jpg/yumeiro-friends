// 3つめ いこうの ぼうけん先（おかしの まち・ほしぞらの しま・はなの ていえん・プリンセスキャッスル・ふしぎな 森）。
// ならびかたは おなじ かたち（ミラーで さゆう はんてん）にして、みため・しかけ・であい・ごほうびを ワールドごとに かえる。
// むずかしさ（tier）が あがるほど：ちからを つかう なかまの ひつような レベル・かわりの そざいの かず・スイッチの かず・おみやげが ふえる。
import type { Ability } from '../types';
import type { ChestDef, EncounterDef, PickupDef, PuzzleDef, SwitchDef, WorldMap, WorldTheme } from './forest';

/** ちからの かわりに つかう そざい（へる） */
const ALT_ITEM: Record<Ability, string> = { flower: 'petal', light: 'star', water: 'drop', power: 'shell', fly: 'cotton' };
const ALT_TEXT: Record<Ability, string> = {
  flower: 'さくらの はなびら',
  light: 'ほしの かけら',
  water: 'まほうの しずく',
  power: 'かいがら',
  fly: 'ふわふわの わた',
};

interface PuzzleText {
  ability: Ability;
  name: string;
  hint: string;
  solvedText: string;
}

interface WorldConfig {
  id: string;
  /** ID の あたまに つける もじ（ワールドを またいで かさならない） */
  key: string;
  name: string;
  tier: number;
  unlock: { world: string; chests: number };
  mirror: boolean;
  /** 4つの ちからの しかけ（ひだりまえ・みぎまえ・ひだりおく・みぎおく） */
  puzzles: [PuzzleText, PuzzleText, PuzzleText, PuzzleText];
  switchPuzzle: { name: string; hint: string; solvedText: string };
  switches: { color: string; name: string }[];
  switchLabel: string;
  switchText: string;
  encounters: [Omit<EncounterDef, 'id' | 'x' | 'z'>, Omit<EncounterDef, 'id' | 'x' | 'z'>, Omit<EncounterDef, 'id' | 'x' | 'z'>];
  /** たからばこの ごほうび（コイン いがい）。[はじめ, A, B, C, D, スイッチ] */
  rewards: Record<string, number>[];
  /** B と スイッチの たからばこで もらえる ふく */
  outfits: [string, string];
  pickups: string[];
  theme: WorldTheme;
}

function buildWorld(c: WorldConfig): WorldMap {
  const m = c.mirror ? -1 : 1;
  const X = (x: number) => x * m;
  const t = c.tier;
  const minLevel = 3 + t * 2; // 5, 7, 9, 11, 13
  const altCount = t + 2; // 3〜7
  const coins = 70 + t * 20;
  const exp = 25 + t * 5;
  const spots = [
    { p: { x: -8, z: 4 }, c: { x: -10.5, z: 6.5 } },
    { p: { x: 9, z: -2 }, c: { x: 11.5, z: -4 } },
    { p: { x: -8, z: -12 }, c: { x: -10.5, z: -14 } },
    { p: { x: 8.5, z: -15 }, c: { x: 11, z: -17 } },
  ];
  const puzzles: PuzzleDef[] = c.puzzles.map((pz, i) => ({
    id: `p${c.key}_${i + 1}`,
    name: pz.name,
    x: X(spots[i].p.x),
    z: spots[i].p.z,
    ability: pz.ability,
    minLevel,
    alt: { item: ALT_ITEM[pz.ability], count: altCount, consume: true, text: `${ALT_TEXT[pz.ability]}を ${altCount}こ つかう` },
    hint: pz.hint,
    solvedText: pz.solvedText,
  }));
  const switchId = `p${c.key}_sw`;
  puzzles.push({ id: switchId, name: c.switchPuzzle.name, x: 0, z: -20, ability: null, hint: c.switchPuzzle.hint, solvedText: c.switchPuzzle.solvedText });

  const chests: ChestDef[] = [
    { id: `c${c.key}_start`, x: X(4), z: 8, reward: { coins, ...c.rewards[0] }, exp: 15 + t * 3 },
    ...spots.map((s, i) => ({
      id: `c${c.key}_${i + 1}`,
      x: X(s.c.x),
      z: s.c.z,
      reward: { coins: coins + 10 * i, ...c.rewards[i + 1] },
      lockedBy: puzzles[i].id,
      exp,
      ...(i === 1 ? { outfit: c.outfits[0] } : {}),
    })),
    { id: `c${c.key}_sw`, x: 0, z: -23.2, reward: { coins: coins + 60, ...c.rewards[5] }, lockedBy: switchId, outfit: c.outfits[1], exp: exp + 10 },
  ];

  // スイッチは おくの ひろばに アーチの かたち
  const n = c.switches.length;
  const switches: SwitchDef[] = c.switches.map((sw, i) => {
    const a = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2; // -1〜1
    return { id: `s${c.key}_${i + 1}`, color: sw.color, name: sw.name, x: a * 5, z: -19.5 - (1 - Math.abs(a)) * 1.6 };
  });
  // かんばんの じゅんばん（ならびとは ちがう じゅんばんに する）
  const order = [...switches].map((s) => s.id);
  const switchOrder = n === 4 ? [order[2], order[0], order[3], order[1]] : [order[1], order[4], order[0], order[3], order[2]];

  const encSpots = [{ x: -5, z: -4 }, { x: 8, z: 9 }, { x: 4.5, z: -9 }];
  const encounters: EncounterDef[] = c.encounters.map((e, i) => ({ ...e, id: `e${c.key}_${i + 1}`, x: X(encSpots[i].x), z: encSpots[i].z }));

  const pkSpots = [{ x: -4, z: 10 }, { x: 7, z: 3 }, { x: -11, z: -2 }, { x: 3, z: -4 }, { x: -12, z: -9 }, { x: 11.5, z: 10 }, { x: 4, z: -13 }, { x: -12, z: -20 }];
  const pickups: PickupDef[] = c.pickups.map((item, i) => ({ id: `k${c.key}_${i + 1}`, item, count: 1 + (i % 3 === 0 ? 1 : 0), x: X(pkSpots[i].x), z: pkSpots[i].z }));

  const lm = c.theme.landmark;
  return {
    id: c.id,
    name: c.name,
    bounds: { minX: -14, maxX: 14, minZ: -24, maxZ: 16 },
    spawn: { x: 0, z: 12 },
    portal: { x: 0, z: 15 },
    chests,
    puzzles,
    switches,
    switchOrder,
    switchPuzzle: switchId,
    sign: { x: X(-3.2), z: -15.5 },
    encounters,
    pickups,
    obstacles: [
      ...puzzles.filter((p) => p.ability).map((p) => ({ x: p.x, z: p.z, r: 1.1, until: p.id })),
      { x: X(lm.x), z: lm.z, r: lm.r },
    ],
    pickupRespawnMs: 10 * 60 * 1000,
    unlock: c.unlock,
    tier: t,
    switchLabel: c.switchLabel,
    switchText: c.switchText,
    theme: { ...c.theme, landmark: { ...lm, x: X(lm.x) } },
  };
}

export const SWEETS = buildWorld({
  id: 'sweets',
  key: '3',
  name: 'おかしの まち',
  tier: 1,
  unlock: { world: 'sea', chests: 4 },
  mirror: false,
  puzzles: [
    { ability: 'water', name: 'かたまった シロップ', hint: 'シロップが かたまって みちが ふさがっている。みずの なかまか、まほうの しずくで とかせそう。', solvedText: 'シロップが とけて、たからばこが みえた！' },
    { ability: 'power', name: 'おおきな クッキーの かべ', hint: 'かたい クッキーの かべ。ちからの なかまか、かいがらで われそう。', solvedText: 'クッキーの かべが ぱっかーん！' },
    { ability: 'flower', name: 'しおれた あめの はな', hint: 'あめざいくの はなが しおれている。はなの なかまか、はなびらで げんきに できそう。', solvedText: 'あめの はなが さいて、たからばこを くれた！' },
    { ability: 'fly', name: 'わたあめの くもの うえ', hint: 'わたあめの くもの うえで なにかが ひかっている。そらの なかまか、わたが あれば とどきそう。', solvedText: 'くもの うえから たからばこを もってきたよ！' },
  ],
  switchPuzzle: { name: 'キャンディの オルゴール', hint: 'かんばんに かいてある じゅんばんで キャンディを おすと、オルゴールが なるらしい。', solvedText: 'あまい メロディが ながれて、たからばこが でてきた！' },
  switches: [{ color: '#ff7f9f', name: 'いちご' }, { color: '#a0704f', name: 'チョコ' }, { color: '#9fe08f', name: 'メロン' }, { color: '#ffe066', name: 'レモン' }],
  switchLabel: '🍬 おす',
  switchText: 'キャンディを この じゅんばんで おしてね',
  encounters: [
    { species: 'ribowan', text: 'リボンの いぬが ケーキやさんの まえで しっぽを ふっているよ。', gift: { item: 'cookie', count: 2 } },
    { species: 'hanajika', text: 'はなの つのの しかが あめの はなを ながめているよ。', gift: { item: 'strawberry', count: 2 } },
    { species: 'patibear', text: 'コックさんの くまが おおきな ケーキを つくっているよ。', gift: { item: 'honeybread', count: 2 } },
  ],
  rewards: [{ cookie: 3, strawberry: 2 }, { drop: 2, cottoncandy: 2 }, { shell: 3, expcandy: 1 }, { petal: 4, pudding: 2 }, { cotton: 3, star: 2 }, { clover: 1, expcandy: 1 }],
  outfits: ['op_sweets', 'acc_lolli'],
  pickups: ['petal', 'cookie', 'drop', 'shell', 'cotton', 'strawberry', 'star', 'cottoncandy'],
  theme: {
    bg: '#fff0e6', sky: '#fff8f0', groundLight: '#ffd9c4', sun: '#fff1dd', ground: '#ffe3cf', path: '#fff8ee', accent: '#ffb8c9',
    decor: 'lollipop', decorColors: ['#ff9ec7', '#8fd3ff', '#ffe066', '#a8ead2', '#cdb8ff'],
    landmark: { kind: 'cake', x: -9.5, z: -6.5, r: 2.2 }, sparkle: '#fff3c0',
  },
});

export const STAR_ISLAND = buildWorld({
  id: 'starisland',
  key: '4',
  name: 'ほしぞらの しま',
  tier: 2,
  unlock: { world: 'sweets', chests: 4 },
  mirror: true,
  puzzles: [
    { ability: 'light', name: 'くらやみの とんねる', hint: 'まっくらで さきが みえない。ひかりの なかまか、ほしの かけらで てらせそう。', solvedText: 'とんねるが ひかって、たからばこが みえた！' },
    { ability: 'fly', name: 'ながれぼしの のこりび', hint: 'たかい いわの うえに ながれぼしが おちた。そらの なかまか、わたの ふうせんで とどきそう。', solvedText: 'ほしの たからばこを はこんで きたよ！' },
    { ability: 'water', name: 'ほしの いずみ', hint: 'いずみが からっぽ。みずの なかまか、まほうの しずくで みたせそう。', solvedText: 'いずみが きらきら みたされた！' },
    { ability: 'power', name: 'つきの いし', hint: 'まるい つきの いしが みちを ふさいでいる。ちからの なかまか、かいがらで ころがせそう。', solvedText: 'つきの いしが ころころ ころがった！' },
  ],
  switchPuzzle: { name: 'せいざの ならび', hint: 'かんばんの じゅんばんで ほしを ひからせると、せいざが できるらしい。', solvedText: 'せいざが そらに うかんで、たからばこが おりてきた！' },
  switches: [{ color: '#8fd3ff', name: 'あお' }, { color: '#ffe066', name: 'きいろ' }, { color: '#ff9ec7', name: 'ピンク' }, { color: '#ffffff', name: 'しろ' }],
  switchLabel: '⭐ ひからせる',
  switchText: 'ほしを この じゅんばんで ひからせてね',
  encounters: [
    { species: 'nijihari', text: 'にじいろの はりねずみが ほしを かぞえているよ。', gift: { item: 'starcandy', count: 1 } },
    { species: 'kirakon', text: 'しっぽの ひかる きつねが つきを みあげているよ。', gift: { item: 'strawberry', count: 3 } },
    { species: 'yozorakon', text: 'よぞらいろの きつねが ながれぼしを おいかけているよ。', gift: { item: 'starcandy', count: 2 } },
  ],
  rewards: [{ star: 2, starcandy: 1 }, { star: 3, drop: 2 }, { cotton: 3, expcandy: 1 }, { drop: 3, star: 2 }, { shell: 3, clover: 1 }, { star: 4, expcandy: 2 }],
  outfits: ['sh_star', 'tiara_star'],
  pickups: ['star', 'drop', 'star', 'cotton', 'starcandy', 'shell', 'star', 'drop'],
  theme: {
    bg: '#2a2560', sky: '#9aa0ff', groundLight: '#4a3d8f', sun: '#e4e6ff', ground: '#5a51a6', path: '#8d84d6', accent: '#9a8cff',
    decor: 'crystal', decorColors: ['#9fe3ff', '#cdb8ff', '#ffe9a8', '#ffb8e0'],
    landmark: { kind: 'moon', x: -9.5, z: -6.5, r: 2 }, night: true, sparkle: '#fff7c0',
  },
});

export const FLOWER_GARDEN = buildWorld({
  id: 'garden',
  key: '5',
  name: 'はなの ていえん',
  tier: 3,
  unlock: { world: 'starisland', chests: 4 },
  mirror: false,
  puzzles: [
    { ability: 'flower', name: 'つぼみの もん', hint: 'おおきな つぼみが もんを ふさいでいる。はなの なかまか、はなびらで ひらかせそう。', solvedText: 'つぼみが ふわっと ひらいた！' },
    { ability: 'water', name: 'かれた ふんすい', hint: 'ふんすいの みずが でない。みずの なかまか、まほうの しずくで うごきそう。', solvedText: 'ふんすいから にじが でた！' },
    { ability: 'fly', name: 'たかい つるの うえ', hint: 'つるの うえに たからばこが ひっかかっている。そらの なかまか、わたが あれば とどきそう。', solvedText: 'つるの うえから たからばこを とってきた！' },
    { ability: 'light', name: 'ひかげの はなばたけ', hint: 'ひかげで はなが ねむっている。ひかりの なかまか、ほしの かけらで おこせそう。', solvedText: 'はなが めを さまして、たからばこを みつけた！' },
  ],
  switchPuzzle: { name: 'はなの とけい', hint: 'かんばんの じゅんばんで はなを さかせると、はなどけいが うごくらしい。', solvedText: 'はなどけいが まわって、たからばこが あらわれた！' },
  switches: [{ color: '#ff8fbf', name: 'ピンク' }, { color: '#ffe066', name: 'きいろ' }, { color: '#cdb8ff', name: 'むらさき' }, { color: '#ff9f7f', name: 'オレンジ' }, { color: '#8fd3ff', name: 'みずいろ' }],
  switchLabel: '🌷 さかせる',
  switchText: 'はなを この じゅんばんで さかせてね',
  encounters: [
    { species: 'mokomoku', text: 'ひつじが はなばたけの うえを ふわふわ ただよっているよ。', gift: { item: 'pudding', count: 2 } },
    { species: 'harujika', text: 'はるかぜを まとった しかが こみちを あるいているよ。', gift: { item: 'nutcake', count: 2 } },
    { species: 'shabonya', text: 'しゃぼんだまの ねこが ふんすいで あそんでいるよ。', gift: { item: 'fishjelly', count: 3 } },
  ],
  rewards: [{ petal: 4, pudding: 2 }, { petal: 5, clover: 1 }, { drop: 4, expcandy: 1 }, { cotton: 4, star: 2 }, { star: 3, petal: 3 }, { clover: 2, expcandy: 2 }],
  outfits: ['hat_tulip', 'bt_petal'],
  pickups: ['petal', 'clover', 'drop', 'petal', 'cotton', 'pudding', 'petal', 'star'],
  theme: {
    bg: '#fff3f8', sky: '#ffffff', groundLight: '#c8f0c0', sun: '#fff6e0', ground: '#c9edb8', path: '#fff3e0', accent: '#ffb8d6',
    decor: 'tulip', decorColors: ['#ff8fbf', '#ffe066', '#cdb8ff', '#ff9f7f', '#ffffff'],
    landmark: { kind: 'fountain', x: -9.5, z: -6.5, r: 2.3 }, sparkle: '#ffffff',
  },
});

export const PRINCESS_CASTLE = buildWorld({
  id: 'castle',
  key: '6',
  name: 'プリンセスキャッスル',
  tier: 4,
  unlock: { world: 'garden', chests: 4 },
  mirror: true,
  puzzles: [
    { ability: 'power', name: 'おもい とびら', hint: 'おしろの とびらが おもくて うごかない。ちからの なかまか、かいがらで あけられそう。', solvedText: 'ぎぃーっと とびらが ひらいた！' },
    { ability: 'light', name: 'きえた シャンデリア', hint: 'シャンデリアの あかりが きえている。ひかりの なかまか、ほしの かけらで つけられそう。', solvedText: 'シャンデリアが きらきら かがやいた！' },
    { ability: 'fly', name: 'とうの まどべ', hint: 'たかい とうの まどべに たからばこが ある。そらの なかまか、わたで とどきそう。', solvedText: 'まどべの たからばこを とってきた！' },
    { ability: 'flower', name: 'いばらの アーチ', hint: 'いばらが アーチを ふさいでいる。はなの なかまか、はなびらで ばらに かえられそう。', solvedText: 'いばらが ばらの アーチに なった！' },
  ],
  switchPuzzle: { name: 'ぶとうかいの ベル', hint: 'かんばんの じゅんばんで ベルを ならすと、ぶとうかいが はじまるらしい。', solvedText: 'ベルが なりひびいて、たからばこが はこばれて きた！' },
  switches: [{ color: '#ffd84d', name: 'きん' }, { color: '#e6e6ff', name: 'ぎん' }, { color: '#ff8fbf', name: 'ばら' }, { color: '#8fd3ff', name: 'そら' }, { color: '#cdb8ff', name: 'すみれ' }],
  switchLabel: '🔔 ならす',
  switchText: 'ベルを この じゅんばんで ならしてね',
  encounters: [
    { species: 'mahoham', text: 'まほうつかいの ハムスターが ほんを よんでいるよ。', gift: { item: 'nutcake', count: 3 } },
    { species: 'princesswan', text: 'ティアラの いぬが おにわを おさんぽ しているよ。', gift: { item: 'starcandy', count: 3 } },
    { species: 'knightwan', text: 'マントの いぬが おしろを まもっているよ。', gift: { item: 'honeybread', count: 4 } },
  ],
  rewards: [{ star: 3, starcandy: 2 }, { shell: 4, clover: 1 }, { star: 4, expcandy: 1 }, { cotton: 4, drop: 3 }, { petal: 6, expcandy: 1 }, { clover: 2, star: 4, expcandy: 2 }],
  outfits: ['sh_crystal', 'dress_rose'],
  pickups: ['star', 'shell', 'drop', 'clover', 'petal', 'starcandy', 'cotton', 'star'],
  theme: {
    bg: '#f6eaff', sky: '#ffffff', groundLight: '#e6d6ff', sun: '#fff4f0', ground: '#efe2ff', path: '#fff6fb', accent: '#d9b8ff',
    decor: 'tower', decorColors: ['#ffffff', '#ffe6f2', '#f3e0ff'],
    landmark: { kind: 'castle', x: -9.5, z: -6.5, r: 2.4 }, sparkle: '#fff3a0',
  },
});

export const MYSTERY_FOREST = buildWorld({
  id: 'mystery',
  key: '7',
  name: 'ふしぎな 森',
  tier: 5,
  unlock: { world: 'castle', chests: 4 },
  mirror: false,
  puzzles: [
    { ability: 'light', name: 'まよいの きり', hint: 'こい きりで まえが みえない。ひかりの なかまか、ほしの かけらで はらえそう。', solvedText: 'きりが はれて、たからばこが みえた！' },
    { ability: 'water', name: 'ねむる きのこ', hint: 'おおきな きのこが ぐっすり。みずの なかまか、まほうの しずくで おこせそう。', solvedText: 'きのこが のびを して、みちを あけてくれた！' },
    { ability: 'power', name: 'ねっこの かべ', hint: 'ふとい ねっこが からまっている。ちからの なかまか、かいがらで ほどけそう。', solvedText: 'ねっこが するする ほどけた！' },
    { ability: 'fly', name: 'ほたるの すきま', hint: 'たかい えだの すきまで ほたるが あつまっている。そらの なかまか、わたで とどきそう。', solvedText: 'ほたるが たからばこまで あんない してくれた！' },
  ],
  switchPuzzle: { name: 'ようせいの わ', hint: 'かんばんの じゅんばんで きのこを たたくと、ようせいの わが ひらくらしい。', solvedText: 'ようせいが おどって、たからばこが あらわれた！' },
  switches: [{ color: '#ff7f8f', name: 'あか' }, { color: '#8fd3ff', name: 'あお' }, { color: '#ffe066', name: 'きいろ' }, { color: '#a8ead2', name: 'みどり' }, { color: '#cdb8ff', name: 'むらさき' }],
  switchLabel: '🍄 たたく',
  switchText: 'きのこを この じゅんばんで たたいてね',
  encounters: [
    { species: 'majoham', text: 'まじょの ハムスターが きのこの スープを まぜているよ。', gift: { item: 'starcandy', count: 4 } },
    { species: 'aurorahari', text: 'オーロラいろの はりねずみが ほたると あそんでいるよ。', gift: { item: 'pudding', count: 4 } },
    { species: 'yumemiho', text: 'ゆめを みている ふくろうが えだの うえで うとうと しているよ。', gift: { item: 'nutcake', count: 4 } },
  ],
  rewards: [{ drop: 3, clover: 1 }, { star: 5, expcandy: 1 }, { drop: 5, clover: 1 }, { shell: 5, expcandy: 2 }, { cotton: 5, star: 3 }, { clover: 3, expcandy: 3 }],
  outfits: ['hat_mushroom', 'dress_fairy'],
  pickups: ['clover', 'drop', 'star', 'cotton', 'shell', 'petal', 'clover', 'expcandy'],
  theme: {
    bg: '#dff3e6', sky: '#f2fff5', groundLight: '#7fbf8f', sun: '#f0ffe8', ground: '#a9d9a8', path: '#e8f3d8', accent: '#9fd8b0',
    decor: 'mushroom', decorColors: ['#ff7f8f', '#cdb8ff', '#8fd3ff', '#ffe066'],
    landmark: { kind: 'bigshroom', x: -9.5, z: -6.5, r: 2.2 }, sparkle: '#e8ffa8',
  },
});

export const MORE_WORLDS: WorldMap[] = [SWEETS, STAR_ISLAND, FLOWER_GARDEN, PRINCESS_CASTLE, MYSTERY_FOREST];
