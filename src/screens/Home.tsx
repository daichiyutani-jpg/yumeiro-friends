import { useMemo } from 'react';
import { getSpecies } from '../game/data/species';
import { receiveStarter } from '../game/logic/friends';
import { helperFinds, plotProgress } from '../game/logic/life';
import { skipTutorial, tutorialText } from '../game/logic/tutorial';
import { useGame, type ScreenId } from '../state/store';
import { Creature } from '../three/Creature';
import { Sparkles } from '../three/Effects';
import { Stage } from '../three/Stage';
import { TownScene } from '../three/TownScene';
import { Modal, useNow, useSave } from '../ui/common';

export function TutorialGuide() {
  const save = useSave();
  const patch = useGame((s) => s.patch);
  const text = tutorialText(save);
  if (!text) return null;
  return (
    <div className="guide" role="status">
      <span style={{ fontSize: '1.5rem' }}>🧚</span>
      <span className="grow">{text}</span>
      <button className="btn small skip" onClick={() => patch(skipTutorial)}>
        スキップ
      </button>
    </div>
  );
}

const MENU: { id: ScreenId; icon: string; label: string }[] = [
  { id: 'friends', icon: '🐰', label: 'なかま' },
  { id: 'dressup', icon: '👗', label: 'きせかえ' },
  { id: 'garden', icon: '🌷', label: 'おはなばたけ' },
  { id: 'town', icon: '🏡', label: 'まちづくり' },
  { id: 'eggs', icon: '🥚', label: 'たまご' },
  { id: 'shop', icon: '🛍️', label: 'おみせ' },
  { id: 'minigame', icon: '🌼', label: 'はなつみ' },
  { id: 'dex', icon: '📖', label: 'ずかん' },
  { id: 'items', icon: '🎒', label: 'もちもの' },
  { id: 'social', icon: '💌', label: 'ともだち' },
  { id: 'settings', icon: '⚙️', label: 'せってい' },
];

export function HomeScreen() {
  const save = useSave();
  const go = useGame((s) => s.go);
  const apply = useGame((s) => s.apply);
  const settings = save.settings;
  const now = useNow(5000);

  const plots = useMemo(() => save.garden.map((p, i) => ({ seedId: p.seedId, progress: plotProgress(save, i, now) })), [save, now]);
  const friends = useMemo(
    () => save.friends.map((f) => ({ uid: f.uid, speciesId: f.speciesId, helper: save.town.helpers.some((h) => h.uid === f.uid) })),
    [save.friends, save.town.helpers],
  );
  const badges: Partial<Record<ScreenId, number>> = {
    eggs: save.eggs.filter((e) => now >= e.readyAt).length,
    garden: plots.filter((p) => p.seedId && p.progress >= 1).length + save.town.helpers.reduce((a, h) => a + helperFinds(h.startedAt, now), 0),
  };
  const needStarter = save.friends.length === 0;

  return (
    <div className="screen">
      <Stage camera={[0, 15, 16]} fov={50} className="canvas-wrap home-canvas">
        <TownScene
          mode="home"
          placed={save.town.placed}
          friends={friends}
          plots={plots}
          player={save.player}
          equipped={save.equipped}
          princess={save.princess}
          reduceMotion={settings.reduceMotion}
          onFriend={(uid) => go('friend', uid)}
          onPlot={() => go('garden')}
        />
      </Stage>
      <div className="hud-top">
        <span className="pill">🌸 {save.player.name}</span>
        <span className="grow" />
        <span className="pill">🪙 {save.coins}</span>
      </div>
      <TutorialGuide />
      <div className="menu">
        <button className="btn primary adventure-btn" onClick={() => go('worlds')}>
          🗺️ ぼうけんに でかける
        </button>
        <div className="menu-grid">
          {MENU.map((m) => (
            <button key={m.id} className="menu-btn" onClick={() => go(m.id)}>
              <span className="ic">{m.icon}</span>
              {m.label}
              {!!badges[m.id] && <span className="badge">{badges[m.id]}</span>}
            </button>
          ))}
        </div>
      </div>
      {needStarter && (
        <Modal title="はじめての であい">
          <div style={{ height: 200, position: 'relative', borderRadius: 20, overflow: 'hidden' }}>
            <Stage camera={[0, 1.1, 2.9]} target={[0, 0.6, 0]} fov={40}>
              <color attach="background" args={['#fff1f8']} />
              <hemisphereLight args={['#ffffff', '#ffe0ee', 2.5]} />
              <directionalLight position={[2, 4, 4]} intensity={1.2} />
              <Creature look={getSpecies('sakuran').look} anim="happy" />
              <Sparkles count={20} radius={0.9} height={1.6} color="#ffd1e3" />
            </Stage>
          </div>
          <p className="center" style={{ lineHeight: 1.8 }}>
            さくらの はなびらが ふわっと ひかって…<br />
            <b>さくらん</b>が あらわれた！<br />
            「いっしょに あそぼう！」
          </p>
          <div className="actions">
            <button className="btn primary block" onClick={() => apply((s) => receiveStarter(s), { sound: 'fanfare' })}>
              🌸 なかまに なる
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
