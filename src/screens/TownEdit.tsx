import { useState } from 'react';
import { FURNITURE, getFurniture } from '../game/data/catalog';
import { MAX_PLACED, moveFurniture, ownsSurface, placeFurniture, rotateFurniture, setSurface, storeFurniture, type WallSide } from '../game/logic/life';
import type { FurnitureDef } from '../game/types';
import { useGame } from '../state/store';
import { RoomScene } from '../three/RoomScene';
import { Stage } from '../three/Stage';
import { Paged, useSave } from '../ui/common';
import { TutorialGuide } from './Home';

type Tab = 'floor' | 'wall' | 'wallpaper' | 'flooring';
const TABS: [Tab, string, string][] = [
  ['floor', '🛋️', 'かぐ'],
  ['wall', '🖼️', 'かべ'],
  ['wallpaper', '🎨', 'かべがみ'],
  ['flooring', '🟫', 'ゆか'],
];
const inTab = (def: FurnitureDef, tab: Tab) =>
  tab === 'wall' ? def.kind === 'wall' : tab === 'wallpaper' || tab === 'flooring' ? def.kind === tab : def.kind !== 'wall' && def.kind !== 'wallpaper' && def.kind !== 'flooring';

/** おうちづくり: もっている かぐ・かざりを おへやに おいて、かべがみと ゆかを はりかえる */
export function TownEditScreen() {
  const save = useSave();
  const apply = useGame((s) => s.apply);
  const go = useGame((s) => s.go);
  const toast = useGame((s) => s.toast);
  const tutorial = useGame((s) => s.tutorial);
  const [tab, setTab] = useState<Tab>('floor');
  const [placing, setPlacing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const sel = selected ? save.town.placed.find((p) => p.uid === selected) : undefined;
  const selDef = sel ? getFurniture(sel.furnitureId) : undefined;
  const placingDef = placing ? getFurniture(placing) : undefined;
  // いま かべに かける物を あつかっているか
  const wallMode = placingDef?.kind === 'wall' || (moving && !!sel?.wall);

  const put = (x: number, z: number, wall?: WallSide) => {
    if (placing) {
      const r = apply((s) => placeFurniture(s, placing, x, z, wall), { sound: 'sparkle' });
      if (r?.ok) {
        tutorial('placed');
        setSelected(r.data as string);
        if ((r.state.town.furniture[placing] ?? 0) <= 0) setPlacing(null);
      }
    } else if (moving && selected) {
      const r = apply((s) => moveFurniture(s, selected, x, z, wall), { quiet: true });
      if (r?.ok) setMoving(false);
    } else {
      setSelected(null);
    }
  };

  const stored = FURNITURE.filter((f) => inTab(f, tab) && (save.town.furniture[f.id] ?? 0) > 0);
  const surfaces = FURNITURE.filter((f) => inTab(f, tab));
  const current = tab === 'wallpaper' ? save.town.wallpaper : save.town.flooring;
  const hint = placing
    ? placingDef?.kind === 'wall'
      ? 'かけたい かべを タップしてね（きいろく ひかっている ところ）'
      : 'おきたい ゆかを タップしてね'
    : tab === 'wall'
      ? 'かべの かざりを えらんでね。おいた物を タップすると うごかせるよ'
      : 'おく かぐを えらんでね。おいた物を タップすると うごかせるよ';

  return (
    <div className="screen edit-screen">
      <Stage camera={[7, 12.5, 10]} fov={50} className="canvas-wrap edit-canvas">
        <RoomScene
          mode="edit"
          placed={save.town.placed}
          wallpaper={save.town.wallpaper}
          flooring={save.town.flooring}
          friends={[]}
          player={save.player}
          equipped={save.equipped}
          princess={save.princess}
          selectedUid={selected}
          highlightWalls={wallMode}
          onFloor={(x, z) => {
            if (wallMode) toast('かべを タップしてね');
            else put(x, z);
          }}
          onWall={(wall, x, z) => {
            if (wallMode) put(x, z, wall);
            else if (placing || moving) toast('ゆかを タップしてね');
            else setSelected(null);
          }}
          onFurniture={(uid) => {
            if (placing || moving) return;
            setSelected(uid);
          }}
        />
      </Stage>
      <div className="hud-top">
        <button className="btn small" onClick={() => go('home')}>✔ できた</button>
        <span className="grow" />
        <span className="pill">🪑 {save.town.placed.length} / {MAX_PLACED}</span>
      </div>
      <TutorialGuide />
      <div className="edit-panel">
        {sel && selDef ? (
          <>
            <div className="row" style={{ marginBottom: 8 }}>
              <b className="grow">{selDef.icon} {selDef.name}</b>
              <button className="btn small" onClick={() => { setSelected(null); setMoving(false); }}>えらびなおす</button>
            </div>
            {moving ? (
              <p className="center" style={{ fontWeight: 800 }}>{sel.wall ? 'かけたい かべを タップしてね' : 'おきたい ばしょを タップしてね'}</p>
            ) : (
              <div className={`grid ${sel.wall ? 'c2' : 'c3'}`}>
                <button className="btn sky" onClick={() => setMoving(true)}>↔ うごかす</button>
                {!sel.wall && <button className="btn lav" onClick={() => apply((s) => rotateFurniture(s, sel.uid), { quiet: true })}>↻ まわす</button>}
                <button className="btn" onClick={() => { apply((s) => storeFurniture(s, sel.uid)); setSelected(null); }}>📦 しまう</button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="edit-tabs">
              {TABS.map(([t, ic, l]) => (
                <button key={t} className={`btn small${tab === t ? ' on' : ''}`} onClick={() => { setTab(t); setPlacing(null); }}>
                  <span className="ic">{ic}</span>
                  {l}
                </button>
              ))}
            </div>
            {tab === 'wallpaper' || tab === 'flooring' ? (
              <>
                <p className="note" style={{ marginTop: 0 }}>えらぶと すぐ はりかわるよ。なくならないので いつでも もどせるよ</p>
                <Paged
                  className="palette"
                  resetKey={tab}
                  items={surfaces.map((def) => {
                    const have = ownsSurface(save, def.id);
                    return (
                      <button
                        key={def.id}
                        className={`choice${current === def.id ? ' on' : ''}`}
                        disabled={!have}
                        onClick={() => apply((s) => setSurface(s, def.id), { sound: 'sparkle', quiet: true })}
                      >
                        <span className="swatch-mini" style={{ background: `linear-gradient(135deg, ${def.color} 50%, ${def.color2 ?? def.color} 50%)` }} />
                        {def.name}
                        {!have && <span className="muted">{def.price !== undefined ? `🪙${def.price}` : '🧵 アトリエ'}</span>}
                      </button>
                    );
                  })}
                />
              </>
            ) : (
              <>
                <p className="note" style={{ marginTop: 0 }}>{hint}</p>
                {stored.length === 0 && <p className="note">しまってある {tab === 'wall' ? 'かざり' : 'かぐ'}は ないよ</p>}
                <Paged
                  className="palette"
                  resetKey={tab}
                  items={stored.map((def) => (
                    <button key={def.id} className={`choice${placing === def.id ? ' on' : ''}`} onClick={() => setPlacing(placing === def.id ? null : def.id)}>
                      <span className="ic">{def.icon}</span>
                      {def.name}
                      <span className="muted">×{save.town.furniture[def.id]}</span>
                    </button>
                  ))}
                />
              </>
            )}
            <div className="row" style={{ marginTop: 8, gap: 6 }}>
              <button className="btn small grow" onClick={() => go('shop', 'furniture')}>🛍️ かいに いく</button>
              <button className="btn small lav grow" onClick={() => go('shop', 'atelier')}>🧵 そざいで つくる</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
