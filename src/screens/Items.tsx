import { useState } from 'react';
import { FURNITURE, OUTFITS } from '../game/data/catalog';
import { ALL_ITEMS } from '../game/data/items';
import type { ItemCategory } from '../game/types';
import { useGame } from '../state/store';
import { Screen, useSave } from '../ui/common';

const TABS: { id: ItemCategory | 'furniture' | 'outfit'; label: string }[] = [
  { id: 'material', label: '✨ そざい' },
  { id: 'food', label: '🍓 ごはん' },
  { id: 'seed', label: '🌱 たね' },
  { id: 'tool', label: '🧰 どうぐ' },
  { id: 'special', label: '🍡 とくべつ' },
  { id: 'furniture', label: '🪑 かぐ' },
  { id: 'outfit', label: '👗 ふく' },
];

export function ItemsScreen() {
  const save = useSave();
  const go = useGame((s) => s.go);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('material');
  let list: { key: string; icon: string; name: string; count: number | string; desc: string }[] = [];
  if (tab === 'furniture') {
    list = FURNITURE.map((f) => {
      const placed = save.town.placed.filter((p) => p.furnitureId === f.id).length;
      const stored = save.town.furniture[f.id] ?? 0;
      return { key: f.id, icon: f.icon, name: f.name, count: stored + placed, desc: `おいてある ${placed} ・ しまってある ${stored}` };
    }).filter((x) => x.count !== 0);
  } else if (tab === 'outfit') {
    list = OUTFITS.filter((o) => save.ownedOutfits.includes(o.id)).map((o) => ({ key: o.id, icon: o.icon, name: o.name, count: '✔', desc: o.source }));
  } else {
    list = ALL_ITEMS.filter((i) => i.category === tab && (save.items[i.id] ?? 0) > 0).map((i) => ({ key: i.id, icon: i.icon, name: i.name, count: save.items[i.id] ?? 0, desc: i.description }));
  }
  return (
    <Screen title="もちもの">
      <div className="pill" style={{ marginBottom: 8 }}>🪙 コイン {save.coins}</div>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`btn small${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
        {list.map((x) => (
          <div key={x.key} className="item-tile">
            <span className="ic">{x.icon}</span>
            <div className="grow">
              <div className="n">{x.name}</div>
              <div className="muted" style={{ fontSize: '.8rem' }}>{x.desc}</div>
            </div>
            <b>{typeof x.count === 'number' ? `×${x.count}` : x.count}</b>
          </div>
        ))}
      </div>
      {list.length === 0 && (
        <p className="note center">
          まだ なにも ないよ。
          <br />
          <button className="btn small" style={{ marginTop: 8 }} onClick={() => go('shop')}>🛍️ おみせへ</button>
        </p>
      )}
    </Screen>
  );
}
