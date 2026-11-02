import type { EggDef, FurnitureDef, OutfitDef, OutfitSlot } from '../types';

export const SLOT_INFO: Record<OutfitSlot, { name: string; icon: string }> = {
  hat: { name: 'ぼうし', icon: '👒' },
  top: { name: 'トップス・ワンピース', icon: '👚' },
  bottom: { name: 'ボトムス', icon: '🩳' },
  shoes: { name: 'くつ', icon: '👟' },
  accessory: { name: 'アクセサリー', icon: '📿' },
  tiara: { name: 'ティアラ', icon: '👑' },
  dress: { name: 'プリンセスドレス', icon: '👗' },
};
export const SLOT_ORDER: OutfitSlot[] = ['top', 'bottom', 'shoes', 'hat', 'accessory', 'tiara', 'dress'];

export const OUTFITS: OutfitDef[] = [
  // トップス・ワンピース（shape: tee / blouse / onepiece）
  { id: 'top_pink', name: 'ピンクの Tシャツ', slot: 'top', icon: '👚', color: '#ffb3d1', shape: 'tee', source: 'さいしょから' },
  { id: 'top_lav', name: 'ラベンダーの ブラウス', slot: 'top', icon: '👚', color: '#cdb8ff', color2: '#ffffff', shape: 'blouse', source: 'さいしょから' },
  { id: 'top_mint', name: 'ミントの パーカー', slot: 'top', icon: '🧥', color: '#a8ead2', shape: 'tee', price: 120, source: 'おみせ' },
  { id: 'op_sakura', name: 'さくらの ワンピース', slot: 'top', icon: '👗', color: '#ffc6dc', color2: '#ffffff', shape: 'onepiece', price: 200, source: 'おみせ' },
  { id: 'op_star', name: 'ほしぞら ワンピース', slot: 'top', icon: '👗', color: '#9d8fe0', color2: '#ffe066', shape: 'onepiece', craft: { star: 4, cotton: 2 }, source: 'アトリエで つくる' },
  // ボトムス（shape: skirt / shorts）
  { id: 'bt_skirt_blue', name: 'みずいろの スカート', slot: 'bottom', icon: '👗', color: '#9fd8ff', shape: 'skirt', source: 'さいしょから' },
  { id: 'bt_shorts', name: 'クリームの ショートパンツ', slot: 'bottom', icon: '🩳', color: '#fff1c9', shape: 'shorts', source: 'さいしょから' },
  { id: 'bt_skirt_pink', name: 'フリルの スカート', slot: 'bottom', icon: '👗', color: '#ff9ec7', color2: '#ffffff', shape: 'skirt', price: 100, source: 'おみせ' },
  // くつ
  { id: 'sh_pink', name: 'ピンクの くつ', slot: 'shoes', icon: '👟', color: '#ff8fbf', shape: 'shoe', source: 'さいしょから' },
  { id: 'sh_boots', name: 'しろい ブーツ', slot: 'shoes', icon: '👢', color: '#ffffff', shape: 'boot', price: 90, source: 'おみせ' },
  { id: 'sh_glass', name: 'ガラスの くつ', slot: 'shoes', icon: '👠', color: '#d8f3ff', shape: 'shoe', craft: { drop: 3, star: 2 }, source: 'アトリエで つくる', princess: true },
  // ぼうし
  { id: 'hat_ribbon', name: 'リボンの ぼうし', slot: 'hat', icon: '👒', color: '#fff1c9', color2: '#ff8fbf', shape: 'brim', price: 80, source: 'おみせ' },
  { id: 'hat_beret', name: 'ベレーぼう', slot: 'hat', icon: '🧢', color: '#b98cff', shape: 'beret', price: 80, source: 'おみせ' },
  { id: 'hat_flower', name: 'はなかんむり', slot: 'hat', icon: '💐', color: '#ff9ec7', color2: '#fff8a8', shape: 'wreath', craft: { petal: 5, clover: 1 }, source: 'アトリエで つくる' },
  // アクセサリー
  { id: 'acc_star', name: 'ほしの ネックレス', slot: 'accessory', icon: '⭐', color: '#ffd84d', shape: 'necklace', source: 'さくらの森の たからばこ' },
  { id: 'acc_bag', name: 'ハートの ポシェット', slot: 'accessory', icon: '👜', color: '#ff7fae', shape: 'bag', price: 110, source: 'おみせ' },
  { id: 'acc_wand', name: 'ゆめの ステッキ', slot: 'accessory', icon: '🪄', color: '#ffe066', color2: '#ff9ec7', shape: 'wand', craft: { star: 3, petal: 3 }, source: 'アトリエで つくる' },
  // ティアラ
  { id: 'tiara_sakura', name: 'さくらの ティアラ', slot: 'tiara', icon: '👑', color: '#ffd84d', color2: '#ff8fbf', shape: 'tiara', source: 'さくらの森の たからばこ', princess: true },
  { id: 'tiara_moon', name: 'つきの ティアラ', slot: 'tiara', icon: '👑', color: '#e6e6ff', color2: '#b98cff', shape: 'tiara', craft: { star: 3, drop: 2 }, source: 'アトリエで つくる', princess: true },
  // プリンセスドレス
  { id: 'dress_yumeiro', name: 'ゆめいろドレス', slot: 'dress', icon: '👗', color: '#ffc6e0', color2: '#e6d6ff', shape: 'gown', craft: { petal: 8, star: 3, drop: 2, cotton: 3 }, source: 'アトリエで つくる', princess: true },
  { id: 'dress_starry', name: 'ほしぞらドレス', slot: 'dress', icon: '👗', color: '#a99cf0', color2: '#fff3a8', shape: 'gown', craft: { star: 8, drop: 4, shell: 2 }, source: 'アトリエで つくる', princess: true },
];

export const STARTER_OUTFITS = ['top_pink', 'top_lav', 'bt_skirt_blue', 'bt_shorts', 'sh_pink'];

const OUTFIT_MAP = new Map(OUTFITS.map((o) => [o.id, o]));
export function getOutfit(id: string | null | undefined): OutfitDef | undefined {
  return id ? OUTFIT_MAP.get(id) : undefined;
}

export const FURNITURE: FurnitureDef[] = [
  { id: 'table', name: 'まるい テーブル', icon: '🪑', kind: 'furniture', price: 60, color: '#fff1c9', color2: '#e8b98a', model: 'table' },
  { id: 'chair', name: 'ハートの いす', icon: '🪑', kind: 'furniture', price: 40, color: '#ffb3d1', model: 'chair', rest: 'sit' },
  { id: 'bed', name: 'ふわふわ ベッド', icon: '🛏️', kind: 'furniture', price: 120, color: '#cdb8ff', color2: '#ffffff', model: 'bed', rest: 'sleep' },
  { id: 'sofa', name: 'くも ソファ', icon: '🛋️', kind: 'furniture', craft: { cotton: 4 }, color: '#ffffff', color2: '#b9e3ff', model: 'sofa', rest: 'sit' },
  { id: 'tree_sakura', name: 'ちいさな さくらの き', icon: '🌸', kind: 'plant', price: 80, color: '#ffc6dc', color2: '#a87b5a', model: 'tree' },
  { id: 'pot', name: 'はなの うえきばち', icon: '🪴', kind: 'plant', price: 30, color: '#ff9ec7', color2: '#e8a07a', model: 'pot' },
  { id: 'fence', name: 'しろい さく', icon: '🚧', kind: 'fence', price: 20, color: '#ffffff', model: 'fence' },
  { id: 'lamp', name: 'おはなの ランプ', icon: '💡', kind: 'light', price: 70, color: '#fff3a8', color2: '#ff9ec7', model: 'lamp' },
  { id: 'starlamp', name: 'ほしの ランプ', icon: '🌟', kind: 'light', craft: { star: 3 }, color: '#ffe066', color2: '#b98cff', model: 'starlamp' },
  { id: 'ball', name: 'にじいろ ボール', icon: '⚽', kind: 'toy', price: 30, color: '#ff9ec7', color2: '#8fd3ff', model: 'ball' },
  { id: 'slide', name: 'すべりだい', icon: '🛝', kind: 'toy', price: 150, color: '#8fd3ff', color2: '#ffe066', model: 'slide' },
  { id: 'fountain', name: 'しゃぼんの ふんすい', icon: '⛲', kind: 'furniture', craft: { drop: 3, shell: 2 }, color: '#e6f6ff', color2: '#8fd3ff', model: 'fountain' },
  { id: 'pumpkin', name: 'かぼちゃの かざり', icon: '🎃', kind: 'season', price: 50, color: '#ffb35c', color2: '#7ed69a', model: 'pumpkin' },
  { id: 'snowman', name: 'ゆきだるま', icon: '⛄', kind: 'season', price: 50, color: '#ffffff', color2: '#ff8fbf', model: 'snowman' },
];
const FURN_MAP = new Map(FURNITURE.map((f) => [f.id, f]));
export function getFurniture(id: string): FurnitureDef | undefined {
  return FURN_MAP.get(id);
}

export const EGGS: EggDef[] = [
  {
    id: 'egg_sakura', name: 'さくらの たまご', icon: '🥚', price: 120, hatchMinutes: 3, color: '#ffd1e3',
    rates: { 1: 0.7, 2: 0.27, 3: 0.03 },
    pool: ['sakuran', 'macaron', 'awanya', 'mokomoku', 'ribowan', 'kirakon', 'hanajika', 'tsukimiho', 'yukipen', 'nijihari'],
  },
  {
    id: 'egg_yume', name: 'ゆめの たまご', icon: '🥚', price: 300, hatchMinutes: 15, color: '#e3d6ff',
    rates: { 1: 0.4, 2: 0.45, 3: 0.15 },
    pool: ['sakuran', 'macaron', 'awanya', 'mokomoku', 'ribowan', 'kirakon', 'hanajika', 'tsukimiho', 'yukipen', 'jewerisu', 'nijihari', 'mahoham'],
  },
];
export function getEgg(id: string): EggDef | undefined {
  return EGGS.find((e) => e.id === id);
}

export interface WorldDef {
  id: string;
  name: string;
  icon: string;
  implemented: boolean;
  unlockText: string;
  color: string;
}
export const WORLDS: WorldDef[] = [
  { id: 'sakura', name: 'さくらの森', icon: '🌸', implemented: true, unlockText: 'あそべるよ', color: '#ffd1e3' },
  { id: 'sweets', name: 'おかしの まち', icon: '🍰', implemented: false, unlockText: 'じゅんびちゅう（まだ あそべません）', color: '#ffe8c9' },
  { id: 'sea', name: 'うみの せかい', icon: '🐚', implemented: false, unlockText: 'じゅんびちゅう（まだ あそべません）', color: '#c9ecff' },
  { id: 'starisland', name: 'ほしぞらの しま', icon: '🌙', implemented: false, unlockText: 'じゅんびちゅう（まだ あそべません）', color: '#ddd6ff' },
  { id: 'garden', name: 'はなの ていえん', icon: '🌷', implemented: false, unlockText: 'じゅんびちゅう（まだ あそべません）', color: '#ffe0ec' },
  { id: 'castle', name: 'プリンセスキャッスル', icon: '🏰', implemented: false, unlockText: 'じゅんびちゅう（まだ あそべません）', color: '#f3e0ff' },
  { id: 'mystery', name: 'ふしぎな 森', icon: '🍄', implemented: false, unlockText: 'じゅんびちゅう（まだ あそべません）', color: '#d9f2d9' },
];
