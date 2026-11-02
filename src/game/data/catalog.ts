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
  // ゆかに おく かぐ
  { id: 'table', name: 'まるい テーブル', icon: '🪑', kind: 'furniture', price: 60, color: '#fff1c9', color2: '#e8b98a', model: 'table' },
  { id: 'chair', name: 'ハートの いす', icon: '🪑', kind: 'furniture', price: 40, color: '#ffb3d1', model: 'chair', rest: 'sit' },
  { id: 'bed', name: 'ふわふわ ベッド', icon: '🛏️', kind: 'furniture', price: 120, color: '#cdb8ff', color2: '#ffffff', model: 'bed', rest: 'sleep' },
  { id: 'sofa', name: 'くも ソファ', icon: '🛋️', kind: 'furniture', craft: { cotton: 4 }, color: '#ffffff', color2: '#b9e3ff', model: 'sofa', rest: 'sit' },
  { id: 'shelf', name: 'えほんの ほんだな', icon: '📚', kind: 'furniture', price: 90, color: '#f3d2b0', color2: '#ff9ec7', model: 'shelf' },
  { id: 'dresser', name: 'ゆめいろ ドレッサー', icon: '🪞', kind: 'furniture', price: 160, color: '#ffe3ef', color2: '#cfeeff', model: 'dresser' },
  { id: 'piano', name: 'ちいさな ピアノ', icon: '🎹', kind: 'furniture', price: 200, color: '#ffffff', color2: '#ff9ec7', model: 'piano' },
  { id: 'fence', name: 'しろい ついたて', icon: '🚪', kind: 'furniture', price: 20, color: '#ffffff', color2: '#ffd1e3', model: 'screen' },
  { id: 'fountain', name: 'しゃぼんの ふんすい', icon: '⛲', kind: 'furniture', craft: { drop: 3, shell: 2 }, color: '#e6f6ff', color2: '#8fd3ff', model: 'fountain' },
  { id: 'tree_sakura', name: 'さくらの おおきな はちうえ', icon: '🌸', kind: 'plant', price: 80, color: '#ffc6dc', color2: '#a87b5a', model: 'tree' },
  { id: 'pot', name: 'はなの うえきばち', icon: '🪴', kind: 'plant', price: 30, color: '#ff9ec7', color2: '#e8a07a', model: 'pot' },
  { id: 'lamp', name: 'おはなの ランプ', icon: '💡', kind: 'light', price: 70, color: '#fff3a8', color2: '#ff9ec7', model: 'lamp' },
  { id: 'starlamp', name: 'ほしの ランプ', icon: '🌟', kind: 'light', craft: { star: 3 }, color: '#ffe066', color2: '#b98cff', model: 'starlamp' },
  { id: 'ball', name: 'にじいろ ボール', icon: '⚽', kind: 'toy', price: 30, color: '#ff9ec7', color2: '#8fd3ff', model: 'ball' },
  { id: 'toybox', name: 'おもちゃばこ', icon: '🎁', kind: 'toy', price: 70, color: '#ffe066', color2: '#ff8fbf', model: 'toybox' },
  { id: 'plush', name: 'ふわふわ ぬいぐるみ', icon: '🧸', kind: 'toy', craft: { cotton: 3, petal: 1 }, color: '#ffe0c2', color2: '#ff9ec7', model: 'plush' },
  { id: 'slide', name: 'おへやの すべりだい', icon: '🛝', kind: 'toy', price: 150, color: '#8fd3ff', color2: '#ffe066', model: 'slide' },
  { id: 'pumpkin', name: 'かぼちゃの かざり', icon: '🎃', kind: 'season', price: 50, color: '#ffb35c', color2: '#7ed69a', model: 'pumpkin' },
  { id: 'snowman', name: 'ゆきだるまの ぬいぐるみ', icon: '⛄', kind: 'season', price: 50, color: '#ffffff', color2: '#ff8fbf', model: 'snowman' },
  // ラグ（ゆかに しく。なかまが すわるよ）
  { id: 'rug_round', name: 'まるい ラグ', icon: '⭕', kind: 'rug', price: 50, color: '#ffd1e3', color2: '#ffffff', model: 'rug_round', rest: 'sit' },
  { id: 'rug_heart', name: 'ハートの ラグ', icon: '💗', kind: 'rug', craft: { cotton: 2, petal: 2 }, color: '#ff9ec7', color2: '#ffe3ef', model: 'rug_heart', rest: 'sit' },
  // かべに かける かざり
  { id: 'window', name: 'あおぞらの まど', icon: '🪟', kind: 'wall', price: 80, color: '#ffffff', color2: '#bfe6ff', model: 'window' },
  { id: 'frame', name: 'おはなの え', icon: '🖼️', kind: 'wall', price: 60, color: '#ffe066', color2: '#ffb3d1', model: 'frame' },
  { id: 'clock', name: 'ハートの とけい', icon: '🕰️', kind: 'wall', price: 70, color: '#ff8fbf', color2: '#ffffff', model: 'clock' },
  { id: 'wallshelf', name: 'かべの たな', icon: '🪵', kind: 'wall', price: 50, color: '#f3d2b0', color2: '#a8ead2', model: 'wallshelf' },
  { id: 'garland', name: 'ほしの ガーランド', icon: '✨', kind: 'wall', craft: { star: 2, petal: 2 }, color: '#ffe066', color2: '#cdb8ff', model: 'garland' },
  { id: 'mirror', name: 'かいがらの かがみ', icon: '🐚', kind: 'wall', craft: { shell: 3, drop: 1 }, color: '#ffe3ef', color2: '#e6f8ff', model: 'mirror' },
  // かべがみ（えらんで はりかえる。なくならない）
  { id: 'wp_cream', name: 'クリームの かべがみ', icon: '🟨', kind: 'wallpaper', starter: true, color: '#fff6e6', color2: '#ffe9c9', pattern: 'plain', model: 'wallpaper' },
  { id: 'wp_stripe', name: 'ピンクの しましま', icon: '🩷', kind: 'wallpaper', price: 100, color: '#ffe3ef', color2: '#ffc6dc', pattern: 'stripe', model: 'wallpaper' },
  { id: 'wp_dot', name: 'ミントの みずたま', icon: '🩵', kind: 'wallpaper', price: 100, color: '#e2f7ee', color2: '#a8ead2', pattern: 'dot', model: 'wallpaper' },
  { id: 'wp_heart', name: 'ハートの かべがみ', icon: '💕', kind: 'wallpaper', price: 140, color: '#fff0f6', color2: '#ff9ec7', pattern: 'heart', model: 'wallpaper' },
  { id: 'wp_star', name: 'ほしぞらの かべがみ', icon: '🌌', kind: 'wallpaper', craft: { star: 3, cotton: 1 }, color: '#d9d2ff', color2: '#fff3a8', pattern: 'star', model: 'wallpaper' },
  { id: 'wp_cloud', name: 'あおぞらの かべがみ', icon: '☁️', kind: 'wallpaper', craft: { cotton: 3, drop: 1 }, color: '#d6efff', color2: '#ffffff', pattern: 'cloud', model: 'wallpaper' },
  // ゆか
  { id: 'fl_wood', name: 'きの ゆか', icon: '🟫', kind: 'flooring', starter: true, color: '#f1d2ae', color2: '#e3bd93', pattern: 'wood', model: 'flooring' },
  { id: 'fl_check', name: 'ピンクの チェック', icon: '🔲', kind: 'flooring', price: 100, color: '#ffe3ef', color2: '#ffc6dc', pattern: 'check', model: 'flooring' },
  { id: 'fl_mint', name: 'ミントの タイル', icon: '🟩', kind: 'flooring', price: 100, color: '#e2f7ee', color2: '#bfeedd', pattern: 'check', model: 'flooring' },
  { id: 'fl_cloud', name: 'ふわふわ くもの ゆか', icon: '🌥️', kind: 'flooring', craft: { cotton: 4 }, color: '#ffffff', color2: '#e6f2ff', pattern: 'cloud', model: 'flooring' },
];
/** かべがみ・ゆかは 1まい もっていれば ずっと つかえる（おく物ではない） */
export function isSurface(def: FurnitureDef): boolean {
  return def.kind === 'wallpaper' || def.kind === 'flooring';
}
export const DEFAULT_WALLPAPER = 'wp_cream';
export const DEFAULT_FLOORING = 'fl_wood';
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
