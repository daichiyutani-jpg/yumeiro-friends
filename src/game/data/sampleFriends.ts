// 友達機能の「おためし」用サンプルデータ。オンラインの実データでも、ローカルのセーブデータでもない。
import type { OutfitSlot, PlacedFurniture, PlayerLook } from '../types';

export interface SampleFriend {
  id: string;
  player: PlayerLook;
  equipped: Record<OutfitSlot, string | null>;
  friends: { uid: string; speciesId: string }[];
  placed: PlacedFurniture[];
  /** おためし交換で 相手が出してくれる物 */
  offers: string[];
}

export const SAMPLE_FRIENDS: SampleFriend[] = [
  {
    id: 'sample_mimi',
    player: { name: 'みみ（みほん）', hairStyle: 'bun', hairColor: '#b98cff', eyeColor: '#2f7fbf', skinColor: '#ffe8d9' },
    equipped: { top: 'op_sakura', bottom: 'bt_skirt_pink', shoes: 'sh_boots', hat: 'hat_flower', accessory: 'acc_bag', tiara: null, dress: null },
    friends: [
      { uid: 'm1', speciesId: 'tsukimiho' },
      { uid: 'm2', speciesId: 'ribowan' },
      { uid: 'm3', speciesId: 'hanajika' },
    ],
    placed: [
      { uid: 'mp1', furnitureId: 'tree_sakura', x: -4, z: -3, rot: 0 },
      { uid: 'mp2', furnitureId: 'fountain', x: 0, z: 0, rot: 0 },
      { uid: 'mp3', furnitureId: 'sofa', x: 3, z: -2, rot: 3 },
      { uid: 'mp4', furnitureId: 'lamp', x: -2, z: 3, rot: 0 },
      { uid: 'mp5', furnitureId: 'fence', x: 4, z: 4, rot: 0 },
      { uid: 'mp6', furnitureId: 'fence', x: 5, z: 4, rot: 0 },
      { uid: 'mp7', furnitureId: 'ball', x: 2, z: 2, rot: 0 },
    ],
    offers: ['star', 'shell', 'cotton'],
  },
  {
    id: 'sample_sora',
    player: { name: 'そら（みほん）', hairStyle: 'long', hairColor: '#8fd3ff', eyeColor: '#5a3d8a', skinColor: '#f4c7a1' },
    equipped: { top: 'top_mint', bottom: 'bt_shorts', shoes: 'sh_pink', hat: 'hat_beret', accessory: null, tiara: null, dress: null },
    friends: [
      { uid: 's1', speciesId: 'yukipen' },
      { uid: 's2', speciesId: 'awanya' },
    ],
    placed: [
      { uid: 'sp1', furnitureId: 'slide', x: -3, z: 0, rot: 1 },
      { uid: 'sp2', furnitureId: 'snowman', x: 3, z: -3, rot: 0 },
      { uid: 'sp3', furnitureId: 'starlamp', x: 0, z: 3, rot: 0 },
      { uid: 'sp4', furnitureId: 'bed', x: 4, z: 1, rot: 0 },
    ],
    offers: ['drop', 'petal', 'clover'],
  },
];
