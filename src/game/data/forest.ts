import type { Ability } from '../types';

/**
 * さくらの森のマップデータ。座標は x（右が+）、z（手前が+）。
 * 新しいワールドを足すときは、同じ形のデータを作って WorldScene に渡す。
 */
export interface ChestDef {
  id: string;
  x: number;
  z: number;
  reward: Record<string, number>;
  outfit?: string;
  /** この謎解きが解けるまで開けられない */
  lockedBy?: string;
  exp: number;
}

export interface PuzzleDef {
  id: string;
  name: string;
  x: number;
  z: number;
  ability: Ability | null;
  /** 能力が無いときの代わりの方法（ゲームが進めなくならないように） */
  alt?: { item: string; count: number; consume: boolean; text: string };
  hint: string;
  solvedText: string;
}

export interface EncounterDef {
  id: string;
  species: string;
  x: number;
  z: number;
  text: string;
}

export interface PickupDef {
  id: string;
  item: string;
  count: number;
  x: number;
  z: number;
}

export interface ObstacleDef {
  x: number;
  z: number;
  r: number;
  /** この謎解きが解けたら通れる */
  until?: string;
}

export const FOREST = {
  id: 'sakura',
  bounds: { minX: -21, maxX: 22, minZ: -28, maxZ: 20 },
  spawn: { x: 0, z: 14 },
  portal: { x: 0, z: 17.5 },
  chests: [
    { id: 'c_start', x: 3.5, z: 9, reward: { coins: 50, petal: 3, cookie: 2 }, exp: 15 },
    { id: 'c_flower', x: -11.5, z: 6, reward: { coins: 60, petal: 2 }, outfit: 'tiara_sakura', lockedBy: 'p_flower', exp: 25 },
    { id: 'c_water', x: -6, z: -3.6, reward: { coins: 60, shell: 3 }, lockedBy: 'p_water', exp: 25 },
    { id: 'c_cave', x: 14, z: -21.4, reward: { coins: 100, star: 3, drop: 1 }, lockedBy: 'p_cave', exp: 30 },
    { id: 'c_secret', x: 19.5, z: -4, reward: { coins: 80, drop: 2, cotton: 1 }, outfit: 'acc_star', lockedBy: 'p_boulder', exp: 30 },
    { id: 'c_tree', x: -14, z: -14, reward: { star: 2, cotton: 2, expcandy: 1 }, lockedBy: 'p_tree', exp: 30 },
    { id: 'c_switch', x: 0, z: -26, reward: { coins: 120, shell: 2, clover: 1 }, lockedBy: 'p_switch', exp: 35 },
  ] as ChestDef[],
  puzzles: [
    {
      id: 'p_flower', name: 'つるの とびら', x: -9, z: 6, ability: 'flower',
      alt: { item: 'petal', count: 3, consume: true, text: 'さくらの はなびらを 3まい そなえる' },
      hint: 'はなの ちからで つるが ほどけるみたい。はなびらを そなえても あくよ。',
      solvedText: 'つるが ほどけて、とびらが ひらいた！',
    },
    {
      id: 'p_water', name: 'きらきら ひかる おがわ', x: -6, z: -1.5, ability: 'water',
      alt: { item: 'net', count: 1, consume: false, text: 'あみで すくう' },
      hint: 'みずの なかで なにかが ひかっている。みずの なかまか、あみが あれば とれそう。',
      solvedText: 'みずの なかから たからばこが でてきた！',
    },
    {
      id: 'p_cave', name: 'まっくらな どうくつ', x: 14, z: -19.2, ability: 'light',
      alt: { item: 'lantern', count: 1, consume: false, text: 'ランタンで てらす' },
      hint: 'なかが まっくらで みえない。ひかりの なかまか、ランタンが あれば すすめそう。',
      solvedText: 'どうくつが あかるく なった！ おくに たからばこが ある！',
    },
    {
      id: 'p_boulder', name: 'おおきな いわ', x: 15.5, z: -4, ability: 'power',
      alt: { item: 'gloves', count: 1, consume: false, text: 'ちからの てぶくろで おす' },
      hint: 'いわの うしろから かぜが ふいてくる…？ ちからの なかまか、てぶくろが あれば うごかせそう。',
      solvedText: 'いわが ころころ… かくしつうろが あらわれた！',
    },
    {
      id: 'p_tree', name: 'たかい さくらの き', x: -14, z: -16.5, ability: 'fly',
      alt: { item: 'ladder', count: 1, consume: false, text: 'はしごで のぼる' },
      hint: 'きの うえで なにかが ひかっている。そらの なかまか、はしごが あれば とどきそう。',
      solvedText: 'きの うえから たからばこを おろしたよ！',
    },
    {
      id: 'p_switch', name: 'はなの スイッチ', x: 0, z: -21, ability: null,
      hint: 'かんばんに「ピンク → きいろ → みずいろ」と かいてある。その じゅんばんで おしてみよう。',
      solvedText: 'スイッチが ぜんぶ ひかった！ たからばこが あらわれた！',
    },
  ] as PuzzleDef[],
  switches: [
    { id: 'sw_pink', color: '#ff7fb6', name: 'ピンク', x: -3.5, z: -22 },
    { id: 'sw_yellow', color: '#ffd84d', name: 'きいろ', x: 0, z: -23.5 },
    { id: 'sw_blue', color: '#6fc4ff', name: 'みずいろ', x: 3.5, z: -22 },
  ],
  switchOrder: ['sw_pink', 'sw_yellow', 'sw_blue'],
  sign: { x: -2.2, z: -18.5 },
  encounters: [
    { id: 'e_bear', species: 'macaron', x: 8, z: 3, text: 'あまい においの くまが こっちを みているよ。' },
    { id: 'e_cat', species: 'awanya', x: -13, z: -4.5, text: 'おがわの そばで ねこが しゃぼんだまを とばしているよ。' },
    { id: 'e_sheep', species: 'mokomoku', x: -4, z: -12, text: 'はらっぱで ひつじが ふわふわ ういているよ。' },
    { id: 'e_fox', species: 'kirakon', x: 9.5, z: -16, text: 'しっぽの ひかる きつねが きに かくれているよ。' },
  ] as EncounterDef[],
  pickups: [
    { id: 'pk1', item: 'petal', count: 1, x: -3, z: 12 },
    { id: 'pk2', item: 'petal', count: 2, x: 6, z: 6 },
    { id: 'pk3', item: 'petal', count: 1, x: -6, z: 9 },
    { id: 'pk4', item: 'cotton', count: 1, x: -8, z: -10 },
    { id: 'pk5', item: 'star', count: 1, x: 6, z: -12 },
    { id: 'pk6', item: 'shell', count: 1, x: 4, z: -2 },
    { id: 'pk7', item: 'drop', count: 1, x: 12, z: -10 },
    { id: 'pk8', item: 'petal', count: 2, x: -16, z: 2 },
    { id: 'pk9', item: 'clover', count: 1, x: -10, z: -20 },
    { id: 'pk10', item: 'star', count: 1, x: 6, z: -24 },
    { id: 'pk11', item: 'cotton', count: 1, x: 18, z: 8 },
    { id: 'pk12', item: 'strawberry', count: 1, x: 10, z: 12 },
  ] as PickupDef[],
  /** 木・いわ などの当たり判定（円） */
  obstacles: [
    { x: 15.5, z: -4, r: 1.6, until: 'p_boulder' },
    { x: -9, z: 6, r: 1.2, until: 'p_flower' },
    { x: -14, z: -16.5, r: 1.1 },
  ] as ObstacleDef[],
  /** 隠し通路の生け垣（x=15 の線。いわの所だけ すきまがある） */
  hedges: [
    { x1: 14.6, x2: 15.4, z1: -16, z2: -5.6 },
    { x1: 14.6, x2: 15.4, z1: -2.4, z2: 6 },
  ],
  /** つるの とびらの まわりの 花のかきね */
  flowerFence: { x1: -14.5, x2: -9.6, z1: 3.2, z2: 8.8 },
  stream: { z: -1.5, width: 3 },
  cave: { x: 14, z: -24.5 },
  /** 時間がたつと 落とし物が また 出てくる（ゲーム内時間・ミリ秒） */
  pickupRespawnMs: 10 * 60 * 1000,
};

export const PICKUP_RESPAWN_MS = FOREST.pickupRespawnMs;
