import { useState } from 'react';
import { FURNITURE, OUTFITS, SLOT_INFO, isSurface } from '../game/data/catalog';
import { FOODS, SEEDS, SPECIALS, TOOLS } from '../game/data/items';
import { hasItems } from '../game/logic/core';
import { ownsSurface } from '../game/logic/life';
import { buyFurniture, buyItem, buyOutfit, craftFurniture, craftOutfit } from '../game/logic/shop';
import type { FurnitureDef, Result, SaveData } from '../game/types';
import { useGame } from '../state/store';
import { Confirm, CostList, Screen, useSave } from '../ui/common';

type Tab = 'food' | 'seed' | 'tool' | 'outfit' | 'furniture' | 'atelier';
const TABS: [Tab, string][] = [
  ['food', '🍓 ごはん'],
  ['seed', '🌱 たね'],
  ['tool', '🧰 どうぐ'],
  ['outfit', '👗 ふく'],
  ['furniture', '🏠 おうち'],
  ['atelier', '🧵 アトリエ'],
];

interface Pending {
  title: string;
  cost: Record<string, number>;
  run: (s: SaveData) => Result;
}

const KIND_NOTE: Partial<Record<FurnitureDef['kind'], string>> = { wall: 'かべに かける', rug: 'ゆかに しく', wallpaper: 'かべがみ', flooring: 'ゆか' };

/** もっている数と、どこに つかう物か */
function furnitureNote(save: SaveData, f: FurnitureDef): string {
  if (isSurface(f)) return `${KIND_NOTE[f.kind]}・はりかえて つかう`;
  const n = (save.town.furniture[f.id] ?? 0) + save.town.placed.filter((p) => p.furnitureId === f.id).length;
  return [`もってる ${n}`, KIND_NOTE[f.kind], f.rest && 'なかまが つかうよ'].filter(Boolean).join(' ・ ');
}

export function ShopScreen() {
  const save = useSave();
  const apply = useGame((s) => s.apply);
  const param = useGame((s) => s.param);
  const [tab, setTab] = useState<Tab>((TABS.find(([t]) => t === param)?.[0]) ?? 'food');
  const [pending, setPending] = useState<Pending | null>(null);

  const ask = (p: Pending) => setPending(p);
  const itemRow = (it: { id: string; icon: string; name: string; price?: number; description: string }) => (
    <div key={it.id} className="item-tile">
      <span className="ic">{it.icon}</span>
      <div className="grow">
        <div className="n">{it.name} <span className="muted">（もってる {save.items[it.id] ?? 0}）</span></div>
        <div className="muted" style={{ fontSize: '.78rem' }}>{it.description}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button className="btn small primary" disabled={save.coins < it.price!} onClick={() => ask({ title: `${it.name}を 1こ かう？`, cost: { coins: it.price! }, run: (s) => buyItem(s, it.id, 1) })}>
          🪙{it.price}
        </button>
        {it.price! <= 40 && (
          <button className="btn small" disabled={save.coins < it.price! * 5} onClick={() => ask({ title: `${it.name}を 5こ かう？`, cost: { coins: it.price! * 5 }, run: (s) => buyItem(s, it.id, 5) })}>
            5こ 🪙{it.price! * 5}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Screen title="おみせ">
      <div className="tabs">
        {TABS.map(([t, l]) => (
          <button key={t} className={`btn small${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>
      <div className="grid list">
        {tab === 'food' && FOODS.map(itemRow)}
        {tab === 'seed' && SEEDS.map(itemRow)}
        {tab === 'tool' && (
          <>
            <p className="note">どうぐが あれば、ちからを もつ なかまが いなくても しかけが とけるよ（なくならないよ）。</p>
            {TOOLS.map(itemRow)}
            {SPECIALS.map(itemRow)}
          </>
        )}
        {tab === 'outfit' &&
          OUTFITS.filter((o) => o.price !== undefined).map((o) => {
            const have = save.ownedOutfits.includes(o.id);
            return (
              <div key={o.id} className="item-tile">
                <span className="ic">{o.icon}</span>
                <div className="grow">
                  <div className="n">{o.name}</div>
                  <div className="muted" style={{ fontSize: '.78rem' }}>{SLOT_INFO[o.slot].name}</div>
                </div>
                {have ? <span className="tag ok">もってる</span> : (
                  <button className="btn small primary" disabled={save.coins < o.price!} onClick={() => ask({ title: `${o.name}を かう？`, cost: { coins: o.price! }, run: (s) => buyOutfit(s, o.id) })}>
                    🪙{o.price}
                  </button>
                )}
              </div>
            );
          })}
        {tab === 'furniture' &&
          FURNITURE.filter((f) => f.price !== undefined).map((f) => {
            const surface = isSurface(f);
            const have = surface && ownsSurface(save, f.id);
            return (
              <div key={f.id} className="item-tile">
                <span className="ic">{f.icon}</span>
                <div className="grow">
                  <div className="n">{f.name}</div>
                  <div className="muted" style={{ fontSize: '.78rem' }}>{furnitureNote(save, f)}</div>
                </div>
                {have ? <span className="tag ok">もってる</span> : (
                  <button className="btn small primary" disabled={save.coins < f.price!} onClick={() => ask({ title: `${f.name}を かう？`, cost: { coins: f.price! }, run: (s) => buyFurniture(s, f.id) })}>
                    🪙{f.price}
                  </button>
                )}
              </div>
            );
          })}
        {tab === 'atelier' && (
          <>
            <p className="note">あつめた そざいで ふくや おうちの かぐ・かべがみを つくれるよ。</p>
            {OUTFITS.filter((o) => o.craft).map((o) => {
              const have = save.ownedOutfits.includes(o.id);
              return (
                <div key={o.id} className="card" style={{ marginBottom: 0 }}>
                  <div className="row">
                    <span style={{ fontSize: '1.7rem' }}>{o.icon}</span>
                    <b className="grow">{o.name}{o.princess && ' 👑'}</b>
                    {have && <span className="tag ok">もってる</span>}
                  </div>
                  {!have && (
                    <>
                      <CostList cost={o.craft!} save={save} />
                      <button className="btn lav block small" disabled={!hasItems(save, o.craft!)} onClick={() => ask({ title: `${o.name}を つくる？`, cost: o.craft!, run: (s) => craftOutfit(s, o.id) })}>
                        🧵 つくる
                      </button>
                    </>
                  )}
                </div>
              );
            })}
            {FURNITURE.filter((f) => f.craft).map((f) => {
              const have = isSurface(f) && ownsSurface(save, f.id);
              return (
                <div key={f.id} className="card" style={{ marginBottom: 0 }}>
                  <div className="row">
                    <span style={{ fontSize: '1.7rem' }}>{f.icon}</span>
                    <b className="grow">{f.name}（{KIND_NOTE[f.kind] ?? 'かぐ'}）</b>
                    {have && <span className="tag ok">もってる</span>}
                  </div>
                  {!have && (
                    <>
                      <CostList cost={f.craft!} save={save} />
                      <button className="btn lav block small" disabled={!hasItems(save, f.craft!)} onClick={() => ask({ title: `${f.name}を つくる？`, cost: f.craft!, run: (s) => craftFurniture(s, f.id) })}>
                        🔨 つくる
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
      <p className="note">ほんものの おかねは つかいません。ゲームの コインと そざい だけで かえるよ。</p>
      {pending && (
        <Confirm
          title={pending.title}
          cost={pending.cost}
          okLabel="はい"
          onCancel={() => setPending(null)}
          onOk={() => {
            const p = pending;
            setPending(null);
            apply(p.run, { sound: 'sparkle' });
          }}
        />
      )}
    </Screen>
  );
}
