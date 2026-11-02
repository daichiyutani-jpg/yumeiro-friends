import type { FoodDef, ItemDef, SeedDef } from '../types';

export const MATERIALS: ItemDef[] = [
  { id: 'petal', name: 'さくらの はなびら', icon: '🌸', category: 'material', description: 'さくらの森で ひろえる、ピンクの はなびら。' },
  { id: 'star', name: 'ほしの かけら', icon: '⭐', category: 'material', description: 'きらきら ひかる ちいさな ほし。' },
  { id: 'shell', name: 'かいがら', icon: '🐚', category: 'material', description: 'おがわで みつかる、うずまきの かいがら。' },
  { id: 'cotton', name: 'ふわふわの わた', icon: '☁️', category: 'material', description: 'くもみたいに やわらかい わた。' },
  { id: 'drop', name: 'まほうの しずく', icon: '💧', category: 'material', description: 'ふしぎな ちからが つまった しずく。' },
  { id: 'clover', name: 'よつばの クローバー', icon: '🍀', category: 'material', description: 'みつけると いいことが ありそう。' },
];

export const FOODS: FoodDef[] = [
  { id: 'cookie', name: 'クッキー', icon: '🍪', category: 'food', price: 10, exp: 5, description: 'さくさくの クッキー。みんな だいすき。' },
  { id: 'strawberry', name: 'いちご', icon: '🍓', category: 'food', price: 15, exp: 6, description: 'あまずっぱい いちご。' },
  { id: 'honeybread', name: 'はちみつパン', icon: '🍯', category: 'food', price: 20, exp: 8, description: 'はちみつ たっぷりの パン。' },
  { id: 'pudding', name: 'ミルクプリン', icon: '🍮', category: 'food', price: 25, exp: 10, description: 'ぷるぷるの プリン。' },
  { id: 'fishjelly', name: 'おさかなゼリー', icon: '🐟', category: 'food', price: 20, exp: 8, description: 'おさかなの かたちの ゼリー。' },
  { id: 'cottoncandy', name: 'わたあめ', icon: '🍭', category: 'food', price: 25, exp: 9, description: 'ふわふわ あまい わたあめ。' },
  { id: 'nutcake', name: 'ナッツケーキ', icon: '🥮', category: 'food', price: 25, exp: 10, description: 'ナッツが のった ケーキ。' },
  { id: 'starcandy', name: 'ほしの キャンディ', icon: '🍬', category: 'food', price: 30, exp: 12, description: 'ほしの かたちの キャンディ。' },
];

export const SEEDS: SeedDef[] = [
  { id: 'seed_sakura', name: 'さくらそうの たね', icon: '🌱', category: 'seed', price: 20, growMinutes: 2, harvest: { petal: 3, coins: 15 }, color: '#ff9ec7', description: '2ふんで さく。さくらの はなびらが とれるよ。' },
  { id: 'seed_star', name: 'ほしゆりの たね', icon: '🌱', category: 'seed', price: 40, growMinutes: 5, harvest: { star: 2, coins: 25 }, color: '#ffe46b', description: '5ふんで さく。ほしの かけらが とれるよ。' },
  { id: 'seed_blue', name: 'みずいろそうの たね', icon: '🌱', category: 'seed', price: 40, growMinutes: 5, harvest: { drop: 2, coins: 25 }, color: '#8fd3ff', description: '5ふんで さく。まほうの しずくが とれるよ。' },
  { id: 'seed_cotton', name: 'わたばなの たね', icon: '🌱', category: 'seed', price: 30, growMinutes: 3, harvest: { cotton: 3, coins: 20 }, color: '#ffffff', description: '3ぷんで さく。ふわふわの わたが とれるよ。' },
  { id: 'seed_clover', name: 'クローバーの たね', icon: '🌱', category: 'seed', price: 60, growMinutes: 10, harvest: { clover: 1, shell: 2, coins: 40 }, color: '#7ed69a', description: '10ぷんで そだつ。よつばが みつかるかも。' },
];

export const TOOLS: ItemDef[] = [
  { id: 'lantern', name: 'ランタン', icon: '🏮', category: 'tool', price: 100, description: 'くらい ばしょを てらせる。ひかりの なかまが いなくても だいじょうぶ。' },
  { id: 'net', name: 'あみ', icon: '🥅', category: 'tool', price: 100, description: 'みずの なかの ものを すくえる。' },
  { id: 'gloves', name: 'ちからの てぶくろ', icon: '🧤', category: 'tool', price: 100, description: 'おもい いわを うごかせる。' },
  { id: 'ladder', name: 'はしご', icon: '🪜', category: 'tool', price: 100, description: 'たかい ところに のぼれる。' },
];

export const SPECIALS: ItemDef[] = [
  { id: 'expcandy', name: 'げんきキャンディ', icon: '🍡', category: 'special', price: 60, description: 'なかまに あげると けいけんちが 30 ふえる。' },
];

export const ALL_ITEMS: ItemDef[] = [...MATERIALS, ...FOODS, ...SEEDS, ...TOOLS, ...SPECIALS];
const ITEM_MAP = new Map(ALL_ITEMS.map((i) => [i.id, i]));

export function getItem(id: string): ItemDef | undefined {
  return ITEM_MAP.get(id);
}
export function getFood(id: string): FoodDef | undefined {
  return FOODS.find((f) => f.id === id);
}
export function getSeed(id: string): SeedDef | undefined {
  return SEEDS.find((s) => s.id === id);
}
export function itemName(id: string): string {
  if (id === 'coins') return 'コイン';
  return ITEM_MAP.get(id)?.name ?? id;
}
export function itemIcon(id: string): string {
  if (id === 'coins') return '🪙';
  return ITEM_MAP.get(id)?.icon ?? '❔';
}
