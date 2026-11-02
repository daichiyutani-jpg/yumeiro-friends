import { useEffect, useState } from 'react';
import { getSpecies } from '../game/data/species';
import { usePwa } from '../pwa';
import { useGame } from '../state/store';
import { Creature } from '../three/Creature';
import { Petals, Sparkles } from '../three/Effects';
import { Stage } from '../three/Stage';
import { Confirm, useOnline } from '../ui/common';

const SHOW = ['sakuran', 'kirakon', 'awanya', 'mokomoku', 'ribowan'];

export function TitleScreen() {
  const save = useGame((s) => s.save);
  const loadError = useGame((s) => s.loadError);
  const startCreate = useGame((s) => s.startCreate);
  const continueGame = useGame((s) => s.continueGame);
  const resetAll = useGame((s) => s.resetAll);
  const pwa = usePwa();
  const online = useOnline();
  const [confirmNew, setConfirmNew] = useState(false);
  const [petal] = useState(() => ({ current: { x: 0, z: 0 } as never }));
  useEffect(() => {
    document.title = 'ゆめいろフレンズ';
  }, []);
  return (
    <div className="screen">
      <Stage camera={[2.2, 2.2, 8]} target={[2.2, 0.9, 0]} fov={45}>
        <color attach="background" args={['#ffeaf4']} />
        <hemisphereLight args={['#fff6fb', '#c8eec0', 2.3]} />
        <directionalLight position={[3, 6, 5]} intensity={1.4} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <circleGeometry args={[6, 32]} />
          <meshLambertMaterial color="#d6f2c8" />
        </mesh>
        {SHOW.map((id, i) => (
          <Creature key={id} look={getSpecies(id).look} anim={i % 2 ? 'happy' : 'idle'} position={[(i - 2) * 0.85, 0, -Math.abs(i - 2) * 0.9]} rotation={[0, -(i - 2) * 0.25, 0]} />
        ))}
        <Sparkles count={30} radius={3} height={3} color="#fff3a0" />
        <Petals target={petal} count={60} area={10} />
      </Stage>
      <div className="logo">
        <h1>ゆめいろフレンズ</h1>
        <p>なかまと いっしょに ゆめいろの ぼうけん</p>
      </div>
      <div className="title-screen" style={{ pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loadError && <div className="toast warn">{loadError}</div>}
          {save ? (
            <>
              <button className="btn primary block" style={{ minHeight: 64, fontSize: '1.2rem' }} onClick={continueGame}>
                ▶ つづきから（{save.player.name}）
              </button>
              <button className="btn block" onClick={() => setConfirmNew(true)}>
                はじめから
              </button>
            </>
          ) : (
            <button className="btn primary block" style={{ minHeight: 64, fontSize: '1.2rem' }} onClick={startCreate}>
              ▶ はじめる
            </button>
          )}
          <p className="status-line">
            <span className="online-dot" style={{ background: online ? '#3aa676' : '#c0a0b0' }} />
            {online ? 'オンライン' : 'オフライン'}
            {pwa.supported && (pwa.ready ? ' ・ オフラインでも あそべます' : ' ・ オフラインの じゅんびちゅう…')}
          </p>
        </div>
      </div>
      {confirmNew && (
        <Confirm
          title="はじめから あそぶ？"
          text={<>いまの セーブデータ（{save?.player.name}）は きえて しまいます。<br />ほんとうに いい？</>}
          okLabel="けして はじめから"
          onCancel={() => setConfirmNew(false)}
          onOk={async () => {
            setConfirmNew(false);
            await resetAll();
            startCreate();
          }}
        />
      )}
    </div>
  );
}
