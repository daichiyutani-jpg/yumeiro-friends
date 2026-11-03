import type { ChestDef, EncounterDef, ObstacleDef, PickupDef, PuzzleDef } from './forest';

/**
 * うみの せかい（すなはま）のマップデータ。座標は x（右が+）、z（手前が+）。
 * ひだりがわ（x < -13）は うみ。ID は さくらの森と かさならないように 's' を つける。
 */
export const SEA = {
  id: 'sea',
  name: 'うみの せかい',
  bounds: { minX: -12, maxX: 20, minZ: -26, maxZ: 18 },
  spawn: { x: 0, z: 13 },
  portal: { x: 0, z: 16.5 },
  chests: [
    { id: 'cs_start', x: 4, z: 8, reward: { coins: 60, shell: 2, fishjelly: 2 }, exp: 15 },
    { id: 'cs_pool', x: -9.8, z: 5, reward: { coins: 70, drop: 2, shell: 1 }, lockedBy: 'ps_pool', exp: 25 },
    { id: 'cs_cove', x: 17, z: 2, reward: { coins: 90, shell: 3 }, outfit: 'hat_straw', lockedBy: 'ps_log', exp: 30 },
    { id: 'cs_light', x: 11.4, z: -16, reward: { coins: 100, star: 3 }, lockedBy: 'ps_light', exp: 30 },
    { id: 'cs_island', x: -10, z: -14, reward: { coins: 80, cotton: 2, expcandy: 1 }, lockedBy: 'ps_island', exp: 30 },
    { id: 'cs_shells', x: 0, z: -25, reward: { coins: 130, drop: 2, clover: 1 }, outfit: 'acc_shell', lockedBy: 'ps_shells', exp: 35 },
  ] as ChestDef[],
  puzzles: [
    {
      id: 'ps_pool', name: 'しおだまりの ひかり', x: -8, z: 3, ability: 'water',
      alt: { item: 'drop', count: 2, consume: true, text: 'まほうの しずくを 2こ つかう' },
      hint: 'しおだまりの そこで なにかが ひかっている。みずの なかまか、まほうの しずくが あれば とれそう。',
      solvedText: 'しおだまりの そこから たからばこが でてきた！',
    },
    {
      id: 'ps_log', name: 'おおきな ながれぎ', x: 12, z: 3, ability: 'power',
      alt: { item: 'gloves', count: 1, consume: false, text: 'ちからの てぶくろで どかす' },
      hint: 'ながれぎの むこうに いりえが あるみたい。ちからの なかまか、てぶくろが あれば どかせそう。',
      solvedText: 'ながれぎが ごろん！ ひみつの いりえに いけるよ！',
    },
    {
      id: 'ps_light', name: 'くらい とうだい', x: 14, z: -15.4, ability: 'light',
      alt: { item: 'lantern', count: 1, consume: false, text: 'ランタンで てらす' },
      hint: 'とうだいの あかりが きえている。ひかりの なかまか、ランタンが あれば つけられそう。',
      solvedText: 'とうだいに あかりが ついた！ たからばこが みえたよ！',
    },
    {
      id: 'ps_island', name: 'はなれじまの ひかり', x: -10.6, z: -11, ability: 'fly',
      alt: { item: 'cotton', count: 3, consume: true, text: 'ふわふわの わた 3こで ふうせんを つくる' },
      hint: 'うみの むこうの しまで なにかが ひかっている。そらの なかまか、わたの ふうせんが あれば とどきそう。',
      solvedText: 'しまから たからばこを はこんで きたよ！',
    },
    {
      id: 'ps_shells', name: 'かいがらの メロディ', x: 0, z: -21, ability: null,
      hint: 'かんばんに「みずいろ → しろ → ピンク」と かいてある。その じゅんばんで かいがらを ならそう。',
      solvedText: 'かいがらが きれいな おとで ないた！ たからばこが あらわれた！',
    },
  ] as PuzzleDef[],
  switches: [
    { id: 'sh_blue', color: '#6fc4ff', name: 'みずいろ', x: -3.4, z: -21 },
    { id: 'sh_white', color: '#ffffff', name: 'しろ', x: 0, z: -22.8 },
    { id: 'sh_pink', color: '#ff9ec7', name: 'ピンク', x: 3.4, z: -21 },
  ],
  switchOrder: ['sh_blue', 'sh_white', 'sh_pink'],
  switchPuzzle: 'ps_shells',
  sign: { x: -2.6, z: -17.4 },
  encounters: [
    { id: 'es_pen', species: 'yukipen', x: -6, z: -7, text: 'なみうちぎわで ぺんぎんが すべって あそんでいるよ。' },
    { id: 'es_risu', species: 'jewerisu', x: 7, z: -11, text: 'いわの うえで りすが ほうせきみたいな かいがらを ならべているよ。' },
    { id: 'es_owl', species: 'tsukimiho', x: 17, z: 7, text: 'いりえの ヤシの きで ふくろうが うとうと しているよ。' },
  ] as EncounterDef[],
  pickups: [
    { id: 'pks1', item: 'shell', count: 1, x: -4, z: 11 },
    { id: 'pks2', item: 'shell', count: 2, x: 7, z: 4 },
    { id: 'pks3', item: 'drop', count: 1, x: -10, z: -2 },
    { id: 'pks4', item: 'star', count: 1, x: 5, z: -4 },
    { id: 'pks5', item: 'shell', count: 1, x: -7, z: -15 },
    { id: 'pks6', item: 'fishjelly', count: 1, x: 9, z: 12 },
    { id: 'pks7', item: 'cotton', count: 1, x: 3, z: -14 },
    { id: 'pks8', item: 'drop', count: 1, x: 17, z: -6 },
    { id: 'pks9', item: 'star', count: 1, x: 8, z: -23 },
    { id: 'pks10', item: 'shell', count: 2, x: 19, z: 9 },
  ] as PickupDef[],
  obstacles: [
    { x: 12, z: 3, r: 1.2, until: 'ps_log' },
    { x: 14, z: -18.2, r: 1.8 },
    { x: -8, z: 3, r: 0.9 },
  ] as ObstacleDef[],
  /** ひみつの いりえ を かこむ いわ（ながれぎの ところだけ すきまが ある） */
  coveWall: { x: 12, z1: -4, z2: 10, gapZ: 3 },
  lighthouse: { x: 14, z: -18.2 },
  /** かざりの ビーチパラソル */
  parasols: [
    { x: -7, z: 11, color: '#8fd3ff' },
    { x: 8.5, z: -3, color: '#ff9ec7' },
    { x: -4.5, z: -3.5, color: '#ffd84d' },
  ],
  island: { x: -19, z: -12 },
  pickupRespawnMs: 10 * 60 * 1000,
  unlock: { world: 'sakura', chests: 3 },
  switchLabel: '🐚 ならす',
  switchText: 'かいがらを この じゅんばんで ならしてね',
};
