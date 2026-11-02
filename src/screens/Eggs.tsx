import { useState } from 'react';
import { EGGS, getEgg } from '../game/data/catalog';
import { RARITY_INFO, getSpecies } from '../game/data/species';
import { MAX_EGG_SLOTS } from '../game/logic/core';
import { buyEgg, eggOdds, hatchEgg } from '../game/logic/life';
import { formatRemain } from '../game/logic/time';
import type { Rarity } from '../game/types';
import { useGame } from '../state/store';
import { Creature } from '../three/Creature';
import { Sparkles } from '../three/Effects';
import { Stage } from '../three/Stage';
import { Confirm, Modal, Screen, useNow, useSave } from '../ui/common';

export function EggsScreen() {
  const save = useSave();
  const apply = useGame((s) => s.apply);
  const now = useNow();
  const [buying, setBuying] = useState<string | null>(null);
  const [odds, setOdds] = useState<string | null>(null);
  const [born, setBorn] = useState<string | null>(null);

  return (
    <Screen title="たまご">
      <div className="section-title">🪺 あたためている たまご（{save.eggs.length} / {MAX_EGG_SLOTS}）</div>
      {save.eggs.length === 0 && <p className="note">まだ たまごが ないよ。したの「たまごやさん」で かえるよ。</p>}
      <div className="grid c2">
        {save.eggs.map((e) => {
          const def = getEgg(e.eggId);
          const ready = now >= e.readyAt;
          const progress = Math.min(1, (now - e.startedAt) / Math.max(1, e.readyAt - e.startedAt));
          return (
            <div key={e.uid} className="card egg-card" style={{ marginBottom: 0 }}>
              <div className={`egg-shape${ready ? ' ready' : ''}`} style={{ background: def?.color }}>{ready ? '✨' : ''}</div>
              <b style={{ fontSize: '.9rem' }}>{def?.name}</b>
              <div className="bar" style={{ margin: '6px 0' }}><i style={{ width: `${progress * 100}%` }} /></div>
              {ready ? (
                <button
                  className="btn primary block small"
                  onClick={() => {
                    const r = apply((s, n) => hatchEgg(s, e.uid, n, Math.random), { quiet: true, sound: 'fanfare' });
                    if (r?.ok) {
                      const uid = r.data as string;
                      setBorn(r.state.friends.find((f) => f.uid === uid)?.speciesId ?? null);
                    }
                  }}
                >
                  🐣 かえす！
                </button>
              ) : (
                <span className="muted" style={{ fontSize: '.85rem' }}>あと {formatRemain(e.readyAt - now)}</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="note">ゲームを とじている あいだも たまごは あたたまるよ。まっている あいだは ぼうけんに いこう！</p>

      <div className="section-title">🥚 たまごやさん（ゲームの コインだけで かえます）</div>
      {EGGS.map((egg) => (
        <div key={egg.id} className="card">
          <div className="row">
            <div className="egg-shape" style={{ background: egg.color, width: 54, height: 68, margin: 0 }} />
            <div className="grow">
              <b>{egg.name}</b>
              <div className="note" style={{ margin: 0 }}>
                うまれるまで {egg.hatchMinutes}ふん ・ ★{Math.round(egg.rates[1] * 100)}% ★★{Math.round(egg.rates[2] * 100)}% ★★★{Math.round(egg.rates[3] * 100)}%
              </div>
            </div>
            <span className="price">🪙 {egg.price}</span>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn small grow" onClick={() => setOdds(egg.id)}>📋 でる かくりつ</button>
            <button className="btn primary small grow" disabled={save.coins < egg.price || save.eggs.length >= MAX_EGG_SLOTS} onClick={() => setBuying(egg.id)}>
              {save.coins < egg.price ? 'コインが たりない' : save.eggs.length >= MAX_EGG_SLOTS ? 'いっぱい' : 'かう'}
            </button>
          </div>
        </div>
      ))}
      <p className="note">おかねで かう ガチャは ありません。コインは ぼうけん・はなつみ・しゅうかく で もらえるよ。</p>

      {buying && (
        <Confirm
          title={`${getEgg(buying)!.name}を かう？`}
          text={`${getEgg(buying)!.hatchMinutes}ふん あたためると うまれるよ。`}
          cost={{ coins: getEgg(buying)!.price }}
          okLabel="かう"
          onCancel={() => setBuying(null)}
          onOk={() => {
            const id = buying;
            setBuying(null);
            apply((s, n) => buyEgg(s, id, n));
          }}
        />
      )}
      {odds && (
        <Modal title={`${getEgg(odds)!.name}の かくりつ`} onClose={() => setOdds(null)}>
          <table className="odds">
            <thead>
              <tr><th>なかま</th><th>レア</th><th>かくりつ</th></tr>
            </thead>
            <tbody>
              {eggOdds(getEgg(odds)!).map((o) => {
                const sp = getSpecies(o.speciesId);
                return (
                  <tr key={o.speciesId}>
                    <td>{save.dex[o.speciesId] ? sp.name : '？？？'}</td>
                    <td>{RARITY_INFO[sp.rarity as Rarity].stars}</td>
                    <td>{(o.rate * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="note">まず レアリティを かくりつで きめて、おなじ レアリティの なかから おなじ かくりつで えらびます。</p>
        </Modal>
      )}
      {born && (
        <Modal title="たまごが かえった！" onClose={() => setBorn(null)} closeLabel="よろしくね！">
          <div className="modal-stage">
            <Stage camera={[0, 1.1, 3]} target={[0, 0.6, 0]} fov={40}>
              <color attach="background" args={['#fff1f8']} />
              <hemisphereLight args={['#ffffff', '#ffe0ee', 2.5]} />
              <directionalLight position={[2, 4, 4]} intensity={1.2} />
              <Creature look={getSpecies(born).look} anim="happy" />
              <Sparkles count={30} radius={1} height={2} color="#fff3a0" />
            </Stage>
          </div>
          <p className="center">
            <b>{getSpecies(born).name}</b>（{RARITY_INFO[getSpecies(born).rarity].stars}）が うまれたよ！
          </p>
        </Modal>
      )}
    </Screen>
  );
}
