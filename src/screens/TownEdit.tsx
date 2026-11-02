import { useMemo, useState } from 'react';
import { getFurniture } from '../game/data/catalog';
import { MAX_PLACED, moveFurniture, placeFurniture, plotProgress, rotateFurniture, storeFurniture } from '../game/logic/life';
import { useGame } from '../state/store';
import { Stage } from '../three/Stage';
import { TownScene } from '../three/TownScene';
import { useSave } from '../ui/common';
import { TutorialGuide } from './Home';

export function TownEditScreen() {
  const save = useSave();
  const apply = useGame((s) => s.apply);
  const go = useGame((s) => s.go);
  const tutorial = useGame((s) => s.tutorial);
  const [placing, setPlacing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const stored = Object.entries(save.town.furniture).filter(([, n]) => n > 0);
  const plots = useMemo(() => save.garden.map((p, i) => ({ seedId: p.seedId, progress: plotProgress(save, i, save.clock.gameTime) })), [save]);
  const sel = selected ? save.town.placed.find((p) => p.uid === selected) : undefined;

  const onGround = (x: number, z: number) => {
    if (placing) {
      const r = apply((s) => placeFurniture(s, placing, x, z), { sound: 'sparkle' });
      if (r?.ok) {
        tutorial('placed');
        setSelected(r.data as string);
        if ((r.state.town.furniture[placing] ?? 0) <= 0) setPlacing(null);
      }
    } else if (moving && selected) {
      apply((s) => moveFurniture(s, selected, x, z), { quiet: true });
      setMoving(false);
    } else {
      setSelected(null);
    }
  };

  return (
    <div className="screen">
      <Stage camera={[0, 17, 12]} fov={50} className="canvas-wrap edit-canvas">
        <TownScene
          mode="edit"
          placed={save.town.placed}
          friends={[]}
          plots={plots}
          player={save.player}
          equipped={save.equipped}
          princess={save.princess}
          selectedUid={selected}
          onGround={onGround}
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
        {sel ? (
          <>
            <div className="row" style={{ marginBottom: 8 }}>
              <b className="grow">{getFurniture(sel.furnitureId)?.icon} {getFurniture(sel.furnitureId)?.name}</b>
              <button className="btn small" onClick={() => { setSelected(null); setMoving(false); }}>えらびなおす</button>
            </div>
            {moving ? (
              <p className="center" style={{ fontWeight: 800 }}>おきたい ばしょを タップしてね</p>
            ) : (
              <div className="grid c3">
                <button className="btn sky" onClick={() => setMoving(true)}>↔ うごかす</button>
                <button className="btn lav" onClick={() => apply((s) => rotateFurniture(s, sel.uid), { quiet: true })}>↻ まわす</button>
                <button className="btn" onClick={() => { apply((s) => storeFurniture(s, sel.uid)); setSelected(null); }}>📦 しまう</button>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="note" style={{ marginTop: 0 }}>
              {placing ? 'おきたい ばしょを タップしてね（きいろい ところに おけるよ）' : 'おく かぐを えらんでね。おいた かぐを タップすると うごかせるよ'}
            </p>
            <div className="palette">
              {stored.map(([id, n]) => {
                const def = getFurniture(id);
                if (!def) return null;
                return (
                  <button key={id} className={`choice${placing === id ? ' on' : ''}`} onClick={() => setPlacing(placing === id ? null : id)}>
                    <span className="ic">{def.icon}</span>
                    {def.name}
                    <span className="muted">×{n}</span>
                  </button>
                );
              })}
              {stored.length === 0 && (
                <button className="choice" onClick={() => go('shop', 'furniture')}>
                  <span className="ic">🛍️</span>かぐを かいに いく
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
