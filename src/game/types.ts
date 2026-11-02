// ゲーム全体で使う型。ゲームロジック（src/game）は React や Three.js に依存しない。

export type Ability = 'flower' | 'light' | 'power' | 'water' | 'fly';
export type Rarity = 1 | 2 | 3;
export type ItemCategory = 'material' | 'food' | 'seed' | 'tool' | 'flower' | 'special';
export type OutfitSlot = 'hat' | 'top' | 'bottom' | 'shoes' | 'accessory' | 'tiara' | 'dress';
export type CareKind = 'feed' | 'pet' | 'play' | 'brush' | 'nap';
export type HairStyle = 'long' | 'twin' | 'bob' | 'bun';

/** キャラクターの見た目（3Dモデルと2Dアイコンの両方で使う） */
export interface CreatureLook {
  body: string;
  belly: string;
  accent: string;
  ears: 'long' | 'pointy' | 'round' | 'tiny' | 'antler' | 'tuft' | 'none';
  tail: 'puff' | 'fluffy' | 'thin' | 'none' | 'spiky';
  motif: 'flower' | 'star' | 'candy' | 'bubble' | 'cloud' | 'gem' | 'leaf' | 'moon' | 'ribbon' | 'rainbow' | 'snow' | 'magic';
  /** 進化した姿の飾り */
  extra?: 'crown' | 'wings' | 'halo' | 'cape';
  scale?: number;
}

export interface Stats {
  power: number;
  explore: number;
}

export interface EvolutionOption {
  to: string;
  level: number;
  affection: number;
  items: Record<string, number>;
  /** 進化先の雰囲気の説明（子ども向け） */
  hint: string;
}

export interface Species {
  id: string;
  name: string;
  /** 進化前の種族ID（進化先のみ） */
  baseId?: string;
  animal: string;
  theme: string;
  rarity: Rarity;
  ability: Ability;
  /** 進化先は複数の能力を持つことがある */
  extraAbility?: Ability;
  baseStats: Stats;
  growth: Stats;
  favoriteFood: string;
  personality: string;
  skills: string[];
  evolutions: EvolutionOption[];
  /** 入手方法の説明（図鑑の「であいかた」） */
  unlock: string;
  /** 素材で仲間にできる場合の必要素材 */
  craft?: Record<string, number>;
  description: string;
  look: CreatureLook;
}

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  category: ItemCategory;
  description: string;
  /** 買える場合の値段（コイン） */
  price?: number;
}

export interface FoodDef extends ItemDef {
  category: 'food';
  exp: number;
}

export interface SeedDef extends ItemDef {
  category: 'seed';
  growMinutes: number;
  harvest: Record<string, number>;
  color: string;
}

export interface OutfitDef {
  id: string;
  name: string;
  slot: OutfitSlot;
  icon: string;
  color: string;
  color2?: string;
  /** 形のバリエーション（3Dモデルで使う） */
  shape: string;
  price?: number;
  craft?: Record<string, number>;
  /** 宝箱・最初から等、入手方法の説明 */
  source: string;
  princess?: boolean;
}

export interface FurnitureDef {
  id: string;
  name: string;
  icon: string;
  kind: 'furniture' | 'plant' | 'fence' | 'light' | 'toy' | 'season';
  price?: number;
  craft?: Record<string, number>;
  color: string;
  color2?: string;
  model: string;
  /** 仲間が座ったり寝たりできる */
  rest?: 'sit' | 'sleep';
}

export interface EggDef {
  id: string;
  name: string;
  icon: string;
  price: number;
  hatchMinutes: number;
  /** レアリティごとの確率（合計1） */
  rates: Record<Rarity, number>;
  /** 出てくる種族 */
  pool: string[];
  color: string;
}

// ---------- セーブデータ ----------

export interface OwnedFriend {
  uid: string;
  speciesId: string;
  baseId: string;
  nickname?: string;
  level: number;
  exp: number;
  affection: number;
  obtainedAt: number;
  /** お世話ごとの最後の時刻（ゲーム内時刻）。連打で上がり過ぎないための短い待ち時間に使う */
  lastCare: Partial<Record<CareKind, number>>;
}

export interface PlacedFurniture {
  uid: string;
  furnitureId: string;
  x: number;
  z: number;
  rot: number;
}

export interface GardenPlot {
  seedId: string | null;
  plantedAt: number;
  readyAt: number;
}

export interface EggSlot {
  uid: string;
  eggId: string;
  startedAt: number;
  readyAt: number;
}

export interface Helper {
  uid: string;
  startedAt: number;
}

export type DexState = 'seen' | 'owned';

export interface PlayerLook {
  name: string;
  hairStyle: HairStyle;
  hairColor: string;
  eyeColor: string;
  skinColor: string;
}

export interface SaveData {
  version: number;
  createdAt: number;
  updatedAt: number;
  player: PlayerLook;
  equipped: Record<OutfitSlot, string | null>;
  ownedOutfits: string[];
  princess: boolean;
  coins: number;
  items: Record<string, number>;
  friends: OwnedFriend[];
  team: string[];
  dex: Record<string, DexState>;
  forest: {
    openedChests: string[];
    solvedPuzzles: string[];
    befriended: string[];
    /** 拾った場所ID → 拾ったゲーム内時刻（一定時間で復活） */
    picked: Record<string, number>;
    visits: number;
  };
  town: {
    placed: PlacedFurniture[];
    furniture: Record<string, number>;
    helpers: Helper[];
    helperFound: number;
  };
  garden: GardenPlot[];
  eggs: EggSlot[];
  tutorial: { step: number; done: boolean };
  settings: { sound: boolean; reduceMotion: boolean; bigText: boolean };
  clock: { gameTime: number; lastReal: number; warned: boolean };
  stats: { chests: number; minigames: number; bestScore: number; harvests: number; hatched: number; evolutions: number };
  achievements: string[];
  nextUid: number;
}

/** 操作の結果。失敗した時は state は変わらない */
export type Result<T = SaveData> = { ok: true; state: T; message?: string; data?: unknown } | { ok: false; reason: string };
