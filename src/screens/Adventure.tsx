import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { getOutfit } from '../game/data/catalog';
import { FOREST } from '../game/data/forest';
import { getItem, itemIcon, itemName } from '../game/data/items';
import { ABILITY_INFO, getSpecies } from '../game/data/species';
import { befriend, checkSwitchOrder, enterForest, forestProgress, getPuzzle, openChest, pickUp, seeEncounter, solvePuzzle } from '../game/logic/adventure';
import { displayName, friendAbilities, getFriend, toggleTeam } from '../game/logic/friends';
import { useGame } from '../state/store';
import { Creature } from '../three/Creature';
import { Sparkles } from '../three/Effects';
import { ForestScene, type Interactable } from '../three/ForestScene';
import { Stage } from '../three/Stage';
import { CreatureIcon, Modal, RewardList, useNow, useSave } from '../ui/common';
import { Joystick, useKeyboard } from '../ui/Joystick';
import { sfx } from '../ui/sound';
import { TutorialGuide } from './Home';

type Dialog =
  | { kind: 'chest'; reward: Record<string, number>; outfit?: string; exp: number }
  | { kind: 'puzzle'; id: string }
  | { kind: 'encounter'; id: string }
  | { kind: 'befriended'; speciesId: string }
  | { kind: 'sign' }
  | { kind: 'portal' }
  | { kind: 'menu' }
  | { kind: 'team' };

export function TeamPicker() {
  const save = useSave();
  const apply = useGame((s) => s.apply);
  return (
    <div className="grid c3">
      {save.friends.map((f) => {
        const sp = getSpecies(f.speciesId);
        const inTeam = save.team.includes(f.uid);
        return (
          <button key={f.uid} className={`friend-card${inTeam ? ' team' : ''}`} onClick={() => apply((s) => toggleTeam(s, f.uid), { quiet: false })} aria-pressed={inTeam}>
            {inTeam && <span className="in-team">チーム</span>}
            <CreatureIcon look={sp.look} size={56} />
            <div className="nm">{displayName(f)}</div>
            <div className="lv">
              {friendAbilities(f).map((a) => `${ABILITY_INFO[a].icon}${ABILITY_INFO[a].name}`).join(' ')}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function AdventureScreen() {
  const save = useSave();
  const apply = useGame((s) => s.apply);
  const patch = useGame((s) => s.patch);
  const tutorial = useGame((s) => s.tutorial);
  const go = useGame((s) => s.go);
  const toast = useGame((s) => s.toast);
  const now = useNow(15000);
  const [near, setNear] = useState<Interactable | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [pressed, setPressed] = useState<string[]>([]);
  const [floats, setFloats] = useState<{ id: number; text: string }[]>([]);
  const heroPos = useRef(new THREE.Vector3(FOREST.spawn.x, 0, FOREST.spawn.z));
  const pickedRef = useRef(new Set<string>());
  const pressedRef = useRef<string[]>([]);

  const entered = useRef(false);
  useEffect(() => {
    if (entered.current) return;
    entered.current = true;
    patch(enterForest);
    tutorial('enterForest');
  }, [patch, tutorial]);

  const float = (text: string) => {
    const id = Math.random();
    setFloats((f) => [...f, { id, text }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1200);
  };

  const interact = useCallback(
    (t: Interactable) => {
      const s = useGame.getState().save!;
      switch (t.kind) {
        case 'chest': {
          const r = apply((st) => openChest(st, t.id), { quiet: true, sound: 'chest' });
          if (r?.ok) {
            const d = r.data as { reward: Record<string, number>; outfit?: string; exp: number };
            setDialog({ kind: 'chest', ...d });
            tutorial('chest');
          }
          break;
        }
        case 'puzzle':
          setDialog({ kind: 'puzzle', id: t.id });
          break;
        case 'switch': {
          if (s.forest.solvedPuzzles.includes('p_switch')) return;
          const prev = pressedRef.current;
          if (prev.includes(t.id)) return;
          const next = [...prev, t.id];
          const res = checkSwitchOrder(next);
          if (res === 'wrong') {
            sfx.no();
            toast('あれれ？ じゅんばんが ちがうみたい。かんばんを みてみよう', 'info');
            pressedRef.current = [];
          } else if (res === 'ok') {
            const r = apply((st) => solvePuzzle(st, 'p_switch', { kind: 'switch' }), { sound: 'fanfare' });
            if (r?.ok) tutorial('puzzle');
            pressedRef.current = next;
          } else {
            sfx.pick();
            pressedRef.current = next;
          }
          setPressed(pressedRef.current);
          break;
        }
        case 'sign':
          setDialog({ kind: 'sign' });
          break;
        case 'encounter':
          setDialog({ kind: 'encounter', id: t.id });
          break;
        case 'portal':
          setDialog({ kind: 'portal' });
          break;
      }
    },
    [apply, toast, tutorial],
  );

  const onPickup = useCallback(
    (id: string) => {
      if (pickedRef.current.has(id)) return;
      pickedRef.current.add(id);
      const r = apply((s, n) => pickUp(s, id, n), { quiet: true, sound: 'pick' });
      if (r?.ok) {
        const [[item, n]] = Object.entries(r.data as Record<string, number>);
        float(`+${n} ${itemIcon(item)} ${itemName(item)}`);
      }
      setTimeout(() => pickedRef.current.delete(id), 1000);
    },
    [apply],
  );
  const onSeen = useCallback((id: string) => patch((s) => seeEncounter(s, id)), [patch]);
  const onMoved = useCallback(() => tutorial('moved'), [tutorial]);
  const doAction = useCallback(() => {
    if (near && !dialog) interact(near);
  }, [near, dialog, interact]);
  useKeyboard(doAction);

  const prog = forestProgress(save);
  const team = save.team.map((u) => getFriend(save, u)).filter((f) => !!f);

  return (
    <div className="screen play-screen">
      <Stage camera={[0, 9, FOREST.spawn.z + 10.5]} fov={50}>
        <ForestScene
          save={save}
          now={now}
          onNear={setNear}
          onInteract={interact}
          onPickup={onPickup}
          onSeen={onSeen}
          onMoved={onMoved}
          pressedSwitches={pressed}
          heroPos={heroPos}
          paused={!!dialog}
        />
      </Stage>
      <div className="adv-top">
        <button className="btn small" onClick={() => setDialog({ kind: 'menu' })}>
          ⏸ メニュー
        </button>
        <span className="pill" style={{ fontSize: '.85rem' }}>🎁 {prog.chests}/{prog.chestTotal}</span>
        <span className="grow" />
        <div className="team-strip">
          {team.map((f) => (
            <button key={f.uid} className="tm" onClick={() => setDialog({ kind: 'team' })} aria-label={`チーム ${displayName(f)}`}>
              <CreatureIcon look={getSpecies(f.speciesId).look} size={30} />
            </button>
          ))}
        </div>
      </div>
      {save.tutorial.done ? null : <TutorialGuide />}
      <Joystick />
      <button className="action-btn" disabled={!near || !!dialog} onClick={doAction} aria-label={near ? near.label : 'ちかくに なにも ないよ'}>
        {near ? near.label : '🔍'}
      </button>
      {floats.map((f) => (
        <div key={f.id} className="float-text">
          {f.text}
        </div>
      ))}
      {dialog && <AdventureDialog dialog={dialog} setDialog={setDialog} onHome={() => { tutorial('returnHome'); go('home'); }} />}
    </div>
  );
}

function AdventureDialog({ dialog, setDialog, onHome }: { dialog: Dialog; setDialog: (d: Dialog | null) => void; onHome: () => void }) {
  const save = useSave();
  const apply = useGame((s) => s.apply);
  const tutorial = useGame((s) => s.tutorial);
  const close = () => setDialog(null);

  switch (dialog.kind) {
    case 'chest': {
      const outfit = getOutfit(dialog.outfit);
      return (
        <Modal title="たからばこを あけた！" onClose={close} closeLabel="やったね！">
          <div className="celebrate">🎁</div>
          <RewardList reward={dialog.reward} />
          {outfit && <p className="center"><span className="reward">{outfit.icon} {outfit.name}（ふく）</span></p>}
          <p className="center muted">チームの なかまが けいけんち {dialog.exp} を もらったよ</p>
        </Modal>
      );
    }
    case 'puzzle': {
      const p = getPuzzle(dialog.id)!;
      const ab = p.ability ? ABILITY_INFO[p.ability] : null;
      const helpers = save.team.map((u) => getFriend(save, u)).filter((f) => f && p.ability && friendAbilities(f).includes(p.ability));
      const altHave = p.alt ? (save.items[p.alt.item] ?? 0) : 0;
      const solve = (method: Parameters<typeof solvePuzzle>[2]) => {
        const r = apply((s) => solvePuzzle(s, p.id, method), { sound: 'fanfare' });
        if (r?.ok) {
          tutorial('puzzle');
          close();
        }
      };
      return (
        <Modal title={p.name} onClose={close} closeLabel="あとで">
          <p style={{ lineHeight: 1.7 }}>{p.hint}</p>
          {ab && (
            <p className="center">
              <span className="tag pink" style={{ fontSize: '.95rem' }}>
                ひつような ちから：{ab.icon} {ab.name}
              </span>
            </p>
          )}
          <div className="actions">
            {helpers.map((f) => (
              <button key={f!.uid} className="btn primary block" onClick={() => solve({ kind: 'ability', friendUid: f!.uid })}>
                <CreatureIcon look={getSpecies(f!.speciesId).look} size={36} /> {displayName(f!)}の {ab?.icon}{ab?.name}の ちからを つかう
              </button>
            ))}
            {p.alt && (
              <button className="btn lav block" disabled={altHave < p.alt.count} onClick={() => solve({ kind: 'item' })}>
                {getItem(p.alt.item)?.icon} {p.alt.text}（もってる {altHave}{altHave < p.alt.count ? '・たりない' : ''}）
              </button>
            )}
            {helpers.length === 0 && (
              <p className="note center">
                ヒント：チームに {ab?.icon}{ab?.name}の なかまを いれるか、
                {p.alt && getItem(p.alt.item)?.price !== undefined ? `おみせで ${getItem(p.alt.item)?.name}を かってね。` : `${itemName(p.alt?.item ?? '')}を あつめてね。`}
              </p>
            )}
            <button className="btn block" onClick={() => setDialog({ kind: 'team' })}>
              🔁 チームを かえる
            </button>
          </div>
        </Modal>
      );
    }
    case 'encounter': {
      const e = FOREST.encounters.find((x) => x.id === dialog.id)!;
      const sp = getSpecies(e.species);
      return (
        <Modal title={`${sp.name}と であった！`} onClose={close} closeLabel="またね">
          <div className="modal-stage">
            <Stage camera={[0, 1.1, 2.9]} target={[0, 0.6, 0]} fov={40}>
              <color attach="background" args={['#fff1f8']} />
              <hemisphereLight args={['#ffffff', '#ffe0ee', 2.5]} />
              <directionalLight position={[2, 4, 4]} intensity={1.2} />
              <Creature look={sp.look} anim="love" />
            </Stage>
          </div>
          <p className="center" style={{ lineHeight: 1.7 }}>
            {e.text}
            <br />
            {ABILITY_INFO[sp.ability].icon} {ABILITY_INFO[sp.ability].name}の ちからを もっているよ。
          </p>
          <div className="actions">
            <button
              className="btn primary block"
              onClick={() => {
                const r = apply((s) => befriend(s, e.id), { quiet: true, sound: 'fanfare' });
                if (r?.ok) setDialog({ kind: 'befriended', speciesId: e.species });
              }}
            >
              💗 なかまに さそう
            </button>
          </div>
        </Modal>
      );
    }
    case 'befriended': {
      const sp = getSpecies(dialog.speciesId);
      return (
        <Modal title={`${sp.name}が なかまに なった！`} onClose={close} closeLabel="いっしょに いこう！">
          <div className="modal-stage">
            <Stage camera={[0, 1.1, 2.9]} target={[0, 0.6, 0]} fov={40}>
              <color attach="background" args={['#fff1f8']} />
              <hemisphereLight args={['#ffffff', '#ffe0ee', 2.5]} />
              <directionalLight position={[2, 4, 4]} intensity={1.2} />
              <Creature look={sp.look} anim="happy" />
              <Sparkles count={20} radius={0.9} height={1.6} color="#fff3a0" />
            </Stage>
          </div>
          <p className="center note">ずかんに とうろく されたよ。チームが いっぱいの ときは「なかま」から いれかえてね。</p>
        </Modal>
      );
    }
    case 'sign':
      return (
        <Modal title="かんばん" onClose={close}>
          <p className="center" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            <span style={{ color: '#e4609e' }}>● ピンク</span> → <span style={{ color: '#b08a00' }}>● きいろ</span> → <span style={{ color: '#2f7fbf' }}>● みずいろ</span>
          </p>
          <p className="center note">はなの スイッチを この じゅんばんで おしてね。まちがえても だいじょうぶ。</p>
        </Modal>
      );
    case 'portal':
      return (
        <Modal title="おうちへ かえる？">
          <p className="center">にじの ゲートを とおって、じぶんの おうちへ かえるよ。</p>
          <div className="actions">
            <button className="btn primary block" onClick={onHome}>🏡 かえる</button>
            <button className="btn block" onClick={close}>まだ たんけんする</button>
          </div>
        </Modal>
      );
    case 'menu': {
      const prog = forestProgress(save);
      return (
        <Modal title="メニュー" onClose={close} closeLabel="▶ つづける">
          <div className="card">
            <div>🎁 たからばこ {prog.chests} / {prog.chestTotal}</div>
            <div>🧩 しかけ {prog.puzzles} / {prog.puzzleTotal}</div>
            <div>💗 であった なかま {prog.friends} / {prog.friendTotal}</div>
          </div>
          <p className="note">そうさ：ひだりの スティックで あるく ／ みぎの ボタンで しらべる ／ いきたい ばしょを タップしても あるけるよ（PC は やじるしキー と スペース）</p>
          <div className="actions">
            <button className="btn block" onClick={() => setDialog({ kind: 'team' })}>🔁 チームを かえる</button>
            <button className="btn lav block" onClick={onHome}>🏡 おうちへ かえる</button>
          </div>
        </Modal>
      );
    }
    case 'team':
      return (
        <Modal title="チームを えらぶ（3にん まで）" onClose={close} closeLabel="これで いく">
          <p className="note center">タップで チームに いれる / はずす</p>
          <TeamPicker />
        </Modal>
      );
  }
}
