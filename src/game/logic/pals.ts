// QRコードで ともだちを とうろくする しくみ。サーバーは つかわず、めの まえの ともだちと QR を みせあう。
// QR に いれるのは ゲームの なかの なまえ・みため・チーム・おうち だけ（ほんみょう・ばしょ などは もともと もっていない）。
import { DEFAULT_FLOORING, DEFAULT_WALLPAPER, getFurniture, getOutfit, isSurface } from '../data/catalog';
import { hasSpecies } from '../data/species';
import type { OutfitSlot, PalCard, PlacedFurniture, PlayerLook, Result, SaveData } from '../types';
import { PAL_CODE_CHARS } from './core';
import { clampToRoom, wallPos } from './life';

export const PAL_QR_PREFIX = 'YMF1';
export const MAX_PALS = 30;
const MAX_PLACED = 40;
const SLOTS: OutfitSlot[] = ['top', 'bottom', 'shoes', 'hat', 'accessory', 'tiara', 'dress'];
const HAIR = ['long', 'twin', 'bob', 'bun'] as const;
const DEFAULT_EQUIPPED: Record<OutfitSlot, string | null> = { top: 'top_pink', bottom: 'bt_skirt_blue', shoes: 'sh_pink', hat: null, accessory: null, tiara: null, dress: null };

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const isColor = (v: unknown): v is string => typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);

export function isPalCode(v: unknown): v is string {
  return typeof v === 'string' && v.length === 8 && [...v].every((c) => PAL_CODE_CHARS.includes(c));
}

/** 「ABCD-EFGH」の かたちで みせる */
export function formatPalCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** なまえ：ふつうの もじだけ・8もじまで */
function cleanName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const n = [...v.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, '').trim()].slice(0, 8).join('');
  return n || null;
}

/** じぶんの カードを QR の もじれつに する（みじかく するため かぐは「id:x:z:むき[:かべ]」を ; で つなぐ） */
export function encodePalCard(s: SaveData): string {
  const team = s.team.length ? s.team : s.friends.slice(0, 3).map((f) => f.uid);
  const species = team.map((u) => s.friends.find((f) => f.uid === u)?.speciesId).filter((x): x is string => !!x).slice(0, 3);
  const placed = s.town.placed.slice(0, MAX_PLACED).map((p) =>
    [p.furnitureId, Math.round(p.x * 2), Math.round(p.z * 2), p.rot, p.wall === 'left' ? 'l' : p.wall === 'back' ? 'b' : ''].join(':').replace(/:$/, ''),
  );
  const body = {
    c: s.palCode,
    n: s.player.name,
    h: [s.player.hairStyle, s.player.hairColor, s.player.eyeColor, s.player.skinColor],
    e: SLOTS.map((k) => s.equipped[k] ?? ''),
    t: species,
    w: s.town.wallpaper,
    f: s.town.flooring,
    p: placed.join(';'),
  };
  return `${PAL_QR_PREFIX}${JSON.stringify(body)}`;
}

/**
 * QR の もじれつを よみとって カードに する。ゆめいろフレンズの QR で なければ null。
 * しらない ふく・かぐ（あたらしい バージョンの もの）は はずして、こわれた あたいは なおす。
 */
export function decodePalCard(text: string, now: number): PalCard | null {
  if (typeof text !== 'string' || !text.startsWith(PAL_QR_PREFIX) || text.length > 3000) return null;
  let d: unknown;
  try {
    d = JSON.parse(text.slice(PAL_QR_PREFIX.length));
  } catch {
    return null;
  }
  if (!isObj(d) || !isPalCode(d.c)) return null;
  const name = cleanName(d.n);
  if (!name) return null;
  const h = Array.isArray(d.h) ? d.h : [];
  const player: PlayerLook = {
    name,
    hairStyle: HAIR.find((x) => x === h[0]) ?? 'long',
    hairColor: isColor(h[1]) ? h[1] : '#8a5a44',
    eyeColor: isColor(h[2]) ? h[2] : '#5a3d8a',
    skinColor: isColor(h[3]) ? h[3] : '#ffe0cc',
  };
  const e = Array.isArray(d.e) ? d.e : [];
  const equipped = { ...DEFAULT_EQUIPPED };
  SLOTS.forEach((slot, i) => {
    const id = e[i];
    if (typeof id === 'string' && getOutfit(id)?.slot === slot) equipped[slot] = id;
    else if (id === '' && slot !== 'top' && slot !== 'shoes') equipped[slot] = null;
  });
  const friends = (Array.isArray(d.t) ? d.t : [])
    .filter((x): x is string => typeof x === 'string' && hasSpecies(x))
    .slice(0, 3)
    .map((speciesId, i) => ({ uid: `pal${i}`, speciesId }));
  const placed: PlacedFurniture[] = [];
  for (const part of (typeof d.p === 'string' ? d.p : '').split(';')) {
    if (placed.length >= MAX_PLACED) break;
    const [fid, xs, zs, rs, ws] = part.split(':');
    const def = fid ? getFurniture(fid) : undefined;
    if (!def || isSurface(def)) continue;
    const x = Number(xs) / 2;
    const z = Number(zs) / 2;
    if (!Number.isFinite(x) || !Number.isFinite(z)) continue;
    const uid = `pp${placed.length}`;
    if (def.kind === 'wall') {
      const wall = ws === 'l' ? 'left' : 'back';
      placed.push({ uid, furnitureId: def.id, ...wallPos(wall, x, z), rot: 0, wall });
    } else {
      const rot = Math.max(0, Math.min(3, Math.floor(Number(rs) || 0)));
      placed.push({ uid, furnitureId: def.id, ...clampToRoom(x, z), rot });
    }
  }
  const surface = (v: unknown, kind: 'wallpaper' | 'flooring', def: string) => (typeof v === 'string' && getFurniture(v)?.kind === kind ? v : def);
  return {
    code: d.c,
    player,
    equipped,
    friends,
    placed,
    wallpaper: surface(d.w, 'wallpaper', DEFAULT_WALLPAPER),
    flooring: surface(d.f, 'flooring', DEFAULT_FLOORING),
    addedAt: now,
    updatedAt: now,
  };
}

/** ともだちに する。おなじ ひとを もういちど よみとったら、すがたと おうちを あたらしく する */
export function addPal(s: SaveData, card: PalCard, now: number): Result {
  if (card.code === s.palCode) return { ok: false, reason: 'これは じぶんの QRコード だよ' };
  const old = s.pals.find((p) => p.code === card.code);
  if (!old && s.pals.length >= MAX_PALS) return { ok: false, reason: `ともだちは ${MAX_PALS}にん まで だよ。だれかを はずしてから とうろくしてね` };
  const next = { ...card, addedAt: old?.addedAt ?? now, updatedAt: now };
  const pals = old ? s.pals.map((p) => (p.code === card.code ? next : p)) : [...s.pals, next];
  return {
    ok: true,
    state: { ...s, pals },
    message: old ? `${card.player.name} の すがたと おうちを あたらしく したよ` : `${card.player.name} と ともだちに なったよ！`,
  };
}

export function removePal(s: SaveData, code: string): Result {
  const p = s.pals.find((x) => x.code === code);
  if (!p) return { ok: false, reason: 'その ともだちは みつからないよ' };
  return { ok: true, state: { ...s, pals: s.pals.filter((x) => x.code !== code) }, message: `${p.player.name} を ともだちから はずしたよ` };
}

/** セーブデータの よみこみ時の なおし（migrate から よぶ） */
export function sanitizePals(v: unknown, own: string): PalCard[] {
  const seen = new Set<string>([own]);
  const out: PalCard[] = [];
  for (const raw of Array.isArray(v) ? v : []) {
    if (!isObj(raw) || !isPalCode(raw.code) || seen.has(raw.code)) continue;
    // いちど QR の かたちに もどして、よみとりと おなじ チェックを とおす
    const pl = isObj(raw.player) ? raw.player : {};
    const eq = isObj(raw.equipped) ? raw.equipped : {};
    const text = PAL_QR_PREFIX + JSON.stringify({
      c: raw.code,
      n: pl.name,
      h: [pl.hairStyle, pl.hairColor, pl.eyeColor, pl.skinColor],
      e: SLOTS.map((k) => (typeof eq[k] === 'string' ? eq[k] : '')),
      t: (Array.isArray(raw.friends) ? raw.friends : []).map((f) => (isObj(f) ? f.speciesId : null)),
      w: raw.wallpaper,
      f: raw.flooring,
      p: (Array.isArray(raw.placed) ? raw.placed : [])
        .filter(isObj)
        .map((p) => [p.furnitureId, Math.round(Number(p.x) * 2), Math.round(Number(p.z) * 2), p.rot, p.wall === 'left' ? 'l' : p.wall === 'back' ? 'b' : ''].join(':'))
        .join(';'),
    });
    const addedAt = typeof raw.addedAt === 'number' && Number.isFinite(raw.addedAt) ? raw.addedAt : 0;
    const card = decodePalCard(text, addedAt);
    if (!card) continue;
    card.updatedAt = typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : addedAt;
    seen.add(card.code);
    out.push(card);
    if (out.length >= MAX_PALS) break;
  }
  return out;
}
