// お店・アトリエ（クラフト）・着せ替え・ミニゲームの報酬
import { getFurniture, getOutfit, isSurface } from '../data/catalog';
import { getItem } from '../data/items';
import type { OutfitSlot, PlayerLook, Result, SaveData } from '../types';
import { MAX_COINS, MAX_STACK, addItemsMut, clone, fail, ok, removeItemsMut } from './core';
import { gainTeamExpMut } from './friends';
import { ownsSurface } from './life';

export function buyItem(state: SaveData, itemId: string, qty = 1): Result {
  const item = getItem(itemId);
  if (!item || item.price === undefined) return fail('その アイテムは うっていないよ');
  if (!Number.isInteger(qty) || qty < 1 || qty > 99) return fail('かずを えらんでね');
  const s = clone(state);
  if (!removeItemsMut(s, { coins: item.price * qty })) return fail('コインが たりないよ');
  addItemsMut(s, { [itemId]: qty });
  return ok(s, `${item.name}を ${qty}こ かったよ`);
}

export function buyOutfit(state: SaveData, outfitId: string): Result {
  const o = getOutfit(outfitId);
  if (!o || o.price === undefined) return fail('その ふくは うっていないよ');
  if (state.ownedOutfits.includes(outfitId)) return fail('もう もっているよ');
  const s = clone(state);
  if (!removeItemsMut(s, { coins: o.price })) return fail('コインが たりないよ');
  s.ownedOutfits.push(outfitId);
  return ok(s, `${o.name}を かったよ`);
}

export function craftOutfit(state: SaveData, outfitId: string): Result {
  const o = getOutfit(outfitId);
  if (!o || !o.craft) return fail('その ふくは つくれないよ');
  if (state.ownedOutfits.includes(outfitId)) return fail('もう もっているよ');
  const s = clone(state);
  if (!removeItemsMut(s, o.craft)) return fail('そざいが たりないよ');
  s.ownedOutfits.push(outfitId);
  return ok(s, `${o.name}が できたよ！`);
}

export function buyFurniture(state: SaveData, furnitureId: string): Result {
  const f = getFurniture(furnitureId);
  if (!f || f.price === undefined) return fail('その かぐは うっていないよ');
  if (isSurface(f) && ownsSurface(state, furnitureId)) return fail('もう もっているよ');
  const s = clone(state);
  if (!removeItemsMut(s, { coins: f.price })) return fail('コインが たりないよ');
  s.town.furniture[furnitureId] = (s.town.furniture[furnitureId] ?? 0) + 1;
  return ok(s, `${f.name}を かったよ`);
}

export function craftFurniture(state: SaveData, furnitureId: string): Result {
  const f = getFurniture(furnitureId);
  if (!f || !f.craft) return fail('その かぐは つくれないよ');
  if (isSurface(f) && ownsSurface(state, furnitureId)) return fail('もう もっているよ');
  const s = clone(state);
  if (!removeItemsMut(s, f.craft)) return fail('そざいが たりないよ');
  s.town.furniture[furnitureId] = (s.town.furniture[furnitureId] ?? 0) + 1;
  return ok(s, `${f.name}が できたよ！`);
}

// ---------- 着せ替え ----------

export function equip(state: SaveData, slot: OutfitSlot, outfitId: string | null): Result {
  if (outfitId !== null) {
    const o = getOutfit(outfitId);
    if (!o || o.slot !== slot) return fail('その ばしょには きられないよ');
    if (!state.ownedOutfits.includes(outfitId)) return fail('まだ もっていないよ');
  }
  // トップスと くつは なしに できない
  if (outfitId === null && (slot === 'top' || slot === 'shoes')) return fail('これは はずせないよ');
  const s = clone(state);
  s.equipped[slot] = outfitId;
  if (slot === 'dress' && outfitId === null) s.princess = false;
  return ok(s);
}

/** プリンセスに変身できるか: ドレス・ティアラ・プリンセスのくつ を1つずつ持っている */
export function princessParts(s: SaveData): { dress?: string; tiara?: string; shoes?: string } {
  const owned = s.ownedOutfits.map((id) => getOutfit(id)).filter((o) => o?.princess);
  return {
    dress: owned.find((o) => o!.slot === 'dress')?.id,
    tiara: owned.find((o) => o!.slot === 'tiara')?.id,
    shoes: owned.find((o) => o!.slot === 'shoes')?.id,
  };
}

export function canTransform(s: SaveData): boolean {
  const p = princessParts(s);
  return !!(p.dress && p.tiara && p.shoes);
}

export function transform(state: SaveData, on: boolean): Result {
  const s = clone(state);
  if (!on) {
    s.princess = false;
    return ok(s, 'もとの すがたに もどったよ');
  }
  if (!canTransform(s)) return fail('ドレス・ティアラ・ガラスの くつ が そろうと へんしん できるよ');
  const p = princessParts(s);
  // すでに プリンセス用の物を着ていれば それを使う
  if (!getOutfit(s.equipped.dress)?.princess) s.equipped.dress = p.dress!;
  if (!getOutfit(s.equipped.tiara)?.princess) s.equipped.tiara = p.tiara!;
  if (!getOutfit(s.equipped.shoes)?.princess) s.equipped.shoes = p.shoes!;
  s.princess = true;
  return ok(s, 'プリンセスに へんしん！');
}

export function updateLook(state: SaveData, look: Partial<PlayerLook>): Result {
  const s = clone(state);
  const name = look.name !== undefined ? look.name.trim().slice(0, 8) : s.player.name;
  if (!name) return fail('なまえを いれてね');
  s.player = { ...s.player, ...look, name };
  return ok(s);
}

// ---------- ミニゲーム ----------

export function minigameReward(score: number): Record<string, number> {
  const sc = Math.max(0, Math.min(200, Math.floor(score)));
  const reward: Record<string, number> = { coins: sc * 3 };
  if (sc >= 4) reward.petal = Math.floor(sc / 4);
  if (sc >= 15) reward.star = 1;
  return reward;
}

export function finishMinigame(state: SaveData, score: number): Result {
  const reward = minigameReward(score);
  const s = clone(state);
  addItemsMut(s, reward);
  gainTeamExpMut(s, Math.min(40, Math.floor(score)));
  s.stats.minigames += 1;
  s.stats.bestScore = Math.max(s.stats.bestScore, Math.floor(score));
  return ok(s, undefined, reward);
}

// ---------- うる ----------

/** そざいの うりね（おみせで かえない もの） */
const MATERIAL_SELL: Record<string, number> = { petal: 3, star: 8, shell: 5, cotton: 5, drop: 8, clover: 20 };

/**
 * 1こ あたりの うりね。かった ねだんの はんぶん（そざいは きまった ねだん）。
 * どうぐは しかけを とくのに つかうので うれない（undefined）。
 */
export function sellPrice(itemId: string): number | undefined {
  const item = getItem(itemId);
  if (!item || item.category === 'tool') return undefined;
  if (MATERIAL_SELL[itemId] !== undefined) return MATERIAL_SELL[itemId];
  return item.price !== undefined ? Math.max(1, Math.floor(item.price / 2)) : undefined;
}

export function sellItem(state: SaveData, itemId: string, qty = 1): Result {
  const item = getItem(itemId);
  const price = sellPrice(itemId);
  if (!item || price === undefined) return fail('それは うれないよ');
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_STACK) return fail('かずを えらんでね');
  if (state.coins + price * qty > MAX_COINS) return fail('コインが いっぱいで これいじょう もてないよ');
  const s = clone(state);
  if (!removeItemsMut(s, { [itemId]: qty })) return fail(`${item.name}が たりないよ`);
  addItemsMut(s, { coins: price * qty });
  return ok(s, `${item.name}を ${qty}こ うって 🪙${price * qty} もらったよ`);
}
