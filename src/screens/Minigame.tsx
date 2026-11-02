import { useEffect, useRef, useState } from 'react';
import { finishMinigame, minigameReward } from '../game/logic/shop';
import { useGame } from '../state/store';
import { Modal, RewardList, Screen, useSave } from '../ui/common';
import { sfx } from '../ui/sound';

const FLOWERS = [
  { e: '🌷', name: 'チューリップ' },
  { e: '🌻', name: 'ひまわり' },
  { e: '🌸', name: 'さくら' },
  { e: '🌼', name: 'デイジー' },
];
const CELLS = 12;
const TIME = 30;

function randomField(): number[] {
  return Array.from({ length: CELLS }, () => Math.floor(Math.random() * FLOWERS.length));
}

/** おはなつみ: しめされた はなを タップで あつめる。まちがえても へらない */
export function MinigameScreen() {
  const save = useSave();
  const apply = useGame((s) => s.apply);
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [field, setField] = useState<number[]>(randomField);
  const [target, setTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(TIME);
  const [flash, setFlash] = useState<Record<number, 'hit' | 'miss'>>({});
  const [reward, setReward] = useState<Record<string, number> | null>(null);
  const scoreRef = useRef(0);

  useEffect(() => {
    if (phase !== 'play') return;
    const tick = setInterval(() => setLeft((l) => l - 1), 1000);
    // ときどき はなが いれかわる（ゆっくりめ）
    const shuffle = setInterval(() => {
      setField((f) => f.map((v) => (Math.random() < 0.25 ? Math.floor(Math.random() * FLOWERS.length) : v)));
    }, 1600);
    // おだいの はなは 8びょう ごとに かわる
    const change = setInterval(() => setTarget(Math.floor(Math.random() * FLOWERS.length)), 8000);
    return () => {
      clearInterval(tick);
      clearInterval(shuffle);
      clearInterval(change);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === 'play' && left <= 0) {
      setPhase('done');
      const r = apply((s) => finishMinigame(s, scoreRef.current), { quiet: true, sound: 'fanfare' });
      if (r?.ok) setReward(r.data as Record<string, number>);
    }
  }, [left, phase, apply]);

  // おだいの はなが ひとつも ない時は ひとつ まぜる（つめなくて こまらないように）
  useEffect(() => {
    if (phase === 'play' && !field.includes(target)) {
      setField((f) => {
        const c = f.slice();
        c[Math.floor(Math.random() * CELLS)] = target;
        return c;
      });
    }
  }, [field, target, phase]);

  const start = () => {
    scoreRef.current = 0;
    setScore(0);
    setLeft(TIME);
    setField(randomField());
    setTarget(Math.floor(Math.random() * FLOWERS.length));
    setReward(null);
    setPhase('play');
  };

  const tap = (i: number) => {
    if (phase !== 'play') return;
    if (field[i] === target) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      sfx.pick();
      setFlash((f) => ({ ...f, [i]: 'hit' }));
      setField((f) => {
        const c = f.slice();
        c[i] = Math.floor(Math.random() * FLOWERS.length);
        return c;
      });
    } else {
      setFlash((f) => ({ ...f, [i]: 'miss' }));
    }
    setTimeout(() => setFlash((f) => {
      const c = { ...f };
      delete c[i];
      return c;
    }), 250);
  };

  return (
    <Screen title="はなつみ ミニゲーム">
      {phase === 'ready' && (
        <div className="card center">
          <div className="celebrate">🌼</div>
          <p style={{ lineHeight: 1.8 }}>
            うえに でる「おだい」の はなを タップして あつめよう！
            <br />
            じかんは {TIME}びょう。まちがえても へらないよ。
          </p>
          <p className="note">さいこう きろく：{save.stats.bestScore}こ ・ あそんだ かいすう：{save.stats.minigames}</p>
          <p className="note">ほうしゅう：1こ につき 🪙3、4こ ごとに 🌸1、15こ いじょうで ⭐1</p>
          <button className="btn primary block" style={{ minHeight: 60 }} onClick={start}>▶ スタート</button>
        </div>
      )}
      {phase !== 'ready' && (
        <>
          <div className="card row" style={{ justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800 }}>
              おだい：<span style={{ fontSize: '2rem', verticalAlign: 'middle' }}>{FLOWERS[target].e}</span> {FLOWERS[target].name}
            </span>
            <span className="tag pink">⏱ {Math.max(0, left)}</span>
            <span className="tag">あつめた {score}</span>
          </div>
          <div className="minigame-field">
            {field.map((v, i) => (
              <button key={i} className={`flower-cell ${flash[i] ?? ''}`} onClick={() => tap(i)} aria-label={FLOWERS[v].name} disabled={phase !== 'play'}>
                {FLOWERS[v].e}
              </button>
            ))}
          </div>
        </>
      )}
      {phase === 'done' && reward && (
        <Modal title={`おしまい！ ${score}こ あつめたよ`}>
          <div className="celebrate">{score >= 15 ? '🏆' : '🌸'}</div>
          <RewardList reward={Object.keys(reward).length ? reward : minigameReward(0)} />
          <p className="center note">チームの なかまも けいけんちを もらったよ</p>
          <div className="actions">
            <button className="btn primary block" onClick={start}>もういちど</button>
            <button className="btn block" onClick={() => setPhase('ready')}>おわる</button>
          </div>
        </Modal>
      )}
    </Screen>
  );
}
