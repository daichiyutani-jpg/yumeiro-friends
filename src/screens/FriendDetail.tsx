import { useEffect, useRef, useState } from 'react';
import { FOODS, getItem } from '../game/data/items';
import { ABILITY_INFO, RARITY_INFO, getSpecies } from '../game/data/species';
import {
  AFFECTION_REWARDS, MAX_AFFECTION, MAX_LEVEL, care, careWait, displayName, evolutionChecks, evolve, expToNext,
  friendAbilities, friendStats, getFriend, revertEvolution, toggleTeam, giveExpCandy, type CareOutcome,
} from '../game/logic/friends';
import { toggleHelper } from '../game/logic/life';
import type { CareKind } from '../game/types';
import { useGame } from '../state/store';
import { Creature, portraitCamera, type CreatureAnim } from '../three/Creature';
import { Sparkles } from '../three/Effects';
import { Stage } from '../three/Stage';
import { Confirm, CostList, CreatureIcon, Modal, Paged, Screen, useNow, useSave } from '../ui/common';

const CARE: { kind: CareKind; icon: string; label: string; anim: CreatureAnim; emote: string }[] = [
  { kind: 'feed', icon: '🍓', label: 'ごはん', anim: 'happy', emote: '😋' },
  { kind: 'pet', icon: '🤚', label: 'なでる', anim: 'love', emote: '💗' },
  { kind: 'play', icon: '⚽', label: 'あそぶ', anim: 'happy', emote: '🎵' },
  { kind: 'brush', icon: '🪮', label: 'ブラッシング', anim: 'love', emote: '✨' },
  { kind: 'nap', icon: '💤', label: 'おひるね', anim: 'sleep', emote: '💤' },
];

type Tab = 'care' | 'grow' | 'profile';

export function FriendDetailScreen() {
  const save = useSave();
  const uid = useGame((s) => s.param);
  const apply = useGame((s) => s.apply);
  const tutorial = useGame((s) => s.tutorial);
  const now = useNow();
  const [tab, setTab] = useState<Tab>('care');
  const [anim, setAnim] = useState<CreatureAnim>('idle');
  const [emote, setEmote] = useState<string | null>(null);
  const [feedOpen, setFeedOpen] = useState(false);
  const [evoTo, setEvoTo] = useState<string | null>(null);
  const [evolved, setEvolved] = useState<string | null>(null);
  const [revert, setRevert] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const f = uid ? getFriend(save, uid) : undefined;
  if (!f) {
    return (
      <Screen title="なかま" back="friends">
        <p className="note">なかまが みつからないよ。</p>
      </Screen>
    );
  }
  const sp = getSpecies(f.speciesId);
  const stats = friendStats(f);
  const inTeam = save.team.includes(f.uid);
  const helping = save.town.helpers.some((h) => h.uid === f.uid);

  const react = (a: CreatureAnim, e: string, ms = 2200) => {
    setAnim(a);
    setEmote(e);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setAnim('idle');
      setEmote(null);
    }, ms);
  };

  const doCare = (kind: CareKind, foodId?: string) => {
    const r = apply((s, n) => care(s, f.uid, kind, n, foodId), { quiet: true, sound: 'sparkle' });
    if (!r) return;
    if (!r.ok) {
      useGame.getState().toast(r.reason);
      return;
    }
    const o = r.data as CareOutcome;
    const c = CARE.find((x) => x.kind === kind)!;
    react(c.anim, o.favorite ? '🥰' : c.emote, kind === 'nap' ? 4000 : 2200);
    useGame.getState().toast(`${o.favorite ? 'だいこうぶつ！ ' : ''}なかよしど +${o.affection}${o.leveled ? ` ・ レベルアップ！ Lv.${getFriend(r.state, f.uid)?.level}` : ''}`, 'good');
    if (kind === 'feed') tutorial('fed');
  };

  const nextReward = AFFECTION_REWARDS.find((r) => r.at > f.affection);
  const checks = evolutionChecks(save, f);

  return (
    <Screen
      title={displayName(f)}
      back="friends"
      side={
        <>
          <div className="stage">
            <Stage key={sp.look.stage ?? 1} {...portraitCamera(sp.look)} fov={40}>
              <color attach="background" args={['#fff4fa']} />
              <hemisphereLight args={['#ffffff', '#e0f0ff', 2.5]} />
              <directionalLight position={[2, 4, 4]} intensity={1.3} />
              <Creature look={sp.look} anim={anim} position={[0, 0, 0]} />
              {(anim !== 'idle' || f.affection >= 80) && <Sparkles count={16} radius={0.8} height={1.5} color="#ffd1e3" />}
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1.2, 32]} />
                <meshLambertMaterial color="#ffe6f2" />
              </mesh>
            </Stage>
            {emote && <span className="emote">{emote}</span>}
          </div>
          <div className="row wrap" style={{ gap: 6 }}>
            <span className="tag pink">{RARITY_INFO[sp.rarity].stars} {RARITY_INFO[sp.rarity].name}</span>
            <span className="tag">Lv.{f.level}</span>
            {friendAbilities(f).map((a) => (
              <span key={a} className="tag sky">{ABILITY_INFO[a].icon} {ABILITY_INFO[a].name}</span>
            ))}
          </div>
          <div className="card status-card">
            <div className="row">
              <span className="lbl">💗 なかよしど</span>
              <div className="bar grow"><i style={{ width: `${(f.affection / MAX_AFFECTION) * 100}%` }} /></div>
              <b>{f.affection}</b>
            </div>
            <div className="row">
              <span className="lbl">⭐ けいけんち</span>
              <div className="bar sky grow"><i style={{ width: f.level >= MAX_LEVEL ? '100%' : `${(f.exp / expToNext(f.level)) * 100}%` }} /></div>
              <b>{f.level >= MAX_LEVEL ? 'MAX' : `${f.exp}/${expToNext(f.level)}`}</b>
            </div>
            {nextReward && <div className="muted">つぎは 💗{nextReward.at} で「{nextReward.text}」</div>}
          </div>
        </>
      }
    >
      <div className="tabs">
        {([['care', '🍓 おせわ'], ['grow', '🌟 そだてる・しんか'], ['profile', '📖 プロフィール']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} className={`btn small${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'care' && (
        <>
          <div className={`care-grid${f.affection >= 10 ? ' c4' : ''}`}>
            {CARE.map((c) => {
              const wait = c.kind === 'feed' ? 0 : careWait(f, c.kind, now);
              return (
                <button key={c.kind} className="btn" onClick={() => (c.kind === 'feed' ? setFeedOpen(true) : doCare(c.kind))} disabled={wait > 0}>
                  <span className="ic">{c.icon}</span>
                  {c.label}
                  {wait > 0 && <span style={{ fontSize: '.7rem' }}>あと {Math.ceil(wait / 1000)}びょう</span>}
                </button>
              );
            })}
            {/* なかよし 10 から ふえる ボタンも おなじ ならびに いれて 1画面に おさめる */}
            {f.affection >= 10 && (
              <>
                <button className="btn mint" onClick={() => react('happy', '🎶')}><span className="ic">🎶</span>リアクション</button>
                <button className="btn lav" disabled={f.affection < 30} onClick={() => react('pose', '🌟', 3000)}>
                  <span className="ic">🌟</span>とくべつポーズ
                  {f.affection < 30 && <span style={{ fontSize: '.7rem' }}>💗30で</span>}
                </button>
              </>
            )}
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className={`btn grow ${inTeam ? '' : 'primary'}`} onClick={() => apply((s) => toggleTeam(s, f.uid))}>
              {inTeam ? 'チームから はずす' : '🐾 チームに いれる'}
            </button>
            <button className="btn grow" onClick={() => apply((s, n) => toggleHelper(s, f.uid, n))}>
              {helping ? '🔍 おてつだいを おやすみ' : '🔍 そざいさがしを たのむ'}
            </button>
          </div>
          <p className="note" style={{ margin: '6px 4px 0', fontSize: '.78rem' }}>
            すきな たべもの：{getItem(sp.favoriteFood)?.icon} {getItem(sp.favoriteFood)?.name}。おせわを わすれても げんきが へったり しないよ。
          </p>
        </>
      )}

      {tab === 'grow' && (
        <>
          <div className="row" style={{ marginBottom: 6 }}>
            <span className="tag">💪 ちから {stats.power}</span>
            <span className="tag">🔎 たんけん {stats.explore}</span>
            <button className="btn lav small grow" disabled={!save.items.expcandy || f.level >= MAX_LEVEL} onClick={() => apply((s) => giveExpCandy(s, f.uid), { sound: 'sparkle' })}>
              🍡 げんきキャンディ（{save.items.expcandy ?? 0}）
            </button>
          </div>
          {checks.length === 0 && <p className="note">この なかまは しんか しないよ。けいけんちは ぼうけん・ミニゲーム・おせわ で たまるよ。</p>}
          <Paged
            className="grid list"
            items={[
              ...checks.map((c) => {
            const to = getSpecies(c.to);
            const evo = getSpecies(f.baseId).evolutions.find((e) => e.to === c.to)!;
            return (
              <div key={c.to} className="card evo-card">
                <div className="row">
                  <CreatureIcon look={to.look} size={40} silhouette={!save.dex[c.to]} />
                  <div className="grow">
                    <b>{save.dex[c.to] ? to.name : '？？？'}</b>
                    <div className="note" style={{ margin: 0 }}>{evo.hint}</div>
                  </div>
                  <div className="evo-tags">
                    <span className={`tag ${c.level ? 'ok' : 'warn'}`}>Lv.{evo.level}{c.level ? ' ✔' : ' まだ'}</span>
                    <span className={`tag ${c.affection ? 'ok' : 'warn'}`}>💗{evo.affection}{c.affection ? ' ✔' : ' まだ'}</span>
                  </div>
                </div>
                <CostList cost={evo.items} save={save} />
                <button className="btn primary block" disabled={!c.ready} onClick={() => setEvoTo(c.to)}>
                  {c.ready ? '✨ この すがたに しんか する' : 'じょうけんが そろうと しんか できるよ'}
                </button>
              </div>
            );
              }),
              ...(f.speciesId !== f.baseId
                ? [
                    <div key="revert" className="card evo-card">
                      <p className="note" style={{ marginTop: 0 }}>しんかは もとに もどしたり、ほかの すがたに えらびなおしたり できるよ（そざいは もどらないよ）。</p>
                      <button className="btn block" onClick={() => setRevert(true)}>
                        ↩ もとの すがた（{getSpecies(f.baseId).name}）に もどす
                      </button>
                    </div>,
                  ]
                : []),
            ]}
          />
        </>
      )}

      {tab === 'profile' && (
        <div className="card profile-card">
          <p style={{ marginTop: 0 }}>{sp.description}</p>
          <div>🐾 どうぶつ：{sp.animal} ・ テーマ：{sp.theme}</div>
          <div>😊 せいかく：{sp.personality}</div>
          <div>🍽️ すきな たべもの：{getItem(sp.favoriteFood)?.icon} {getItem(sp.favoriteFood)?.name}</div>
          <div>✨ スキル：{sp.skills.join('、')}</div>
          <div>🗺️ たんけんの ちから：{friendAbilities(f).map((a) => `${ABILITY_INFO[a].icon}${ABILITY_INFO[a].name}（${ABILITY_INFO[a].text}）`).join(' / ')}</div>
          <div className="note">なかよしで ひらく もの：{AFFECTION_REWARDS.map((r) => `${r.at}「${r.text}」${f.affection >= r.at ? '✔' : ''}`).join(' / ')}</div>
        </div>
      )}

      {feedOpen && (
        <Modal title="どの ごはんを あげる？" onClose={() => setFeedOpen(false)} closeLabel="やめる" wide>
          <Paged
            className="grid c2"
            items={FOODS.map((food) => {
              const have = save.items[food.id] ?? 0;
              return (
                <button
                  key={food.id}
                  className="item-tile"
                  style={{ border: 0, opacity: have ? 1 : 0.45 }}
                  disabled={!have}
                  onClick={() => {
                    setFeedOpen(false);
                    doCare('feed', food.id);
                  }}
                >
                  <span className="ic">{food.icon}</span>
                  <span className="grow" style={{ textAlign: 'left' }}>
                    <span className="n">{food.name}</span>
                    <br />
                    <span className="muted" style={{ fontSize: '.8rem' }}>×{have}{sp.favoriteFood === food.id ? ' ・ だいこうぶつ' : ''}</span>
                  </span>
                </button>
              );
            })}
          />
          <p className="note">ごはんは「おみせ」で かえるよ。つかうと 1こ へるよ。</p>
        </Modal>
      )}
      {evoTo && (
        <Confirm
          title="しんか する？"
          text={<>{displayName(f)}が <b>{getSpecies(evoTo).name}</b> に しんかします。</>}
          cost={getSpecies(f.baseId).evolutions.find((e) => e.to === evoTo)!.items}
          okLabel="✨ しんか する"
          onCancel={() => setEvoTo(null)}
          onOk={() => {
            const to = evoTo;
            setEvoTo(null);
            const r = apply((s) => evolve(s, f.uid, to), { sound: 'fanfare' });
            if (r?.ok) setEvolved(to);
          }}
        />
      )}
      {evolved && (
        <Modal title="しんか した！" onClose={() => setEvolved(null)} closeLabel="すごい！">
          <div className="modal-stage">
            <Stage {...portraitCamera(getSpecies(evolved).look)} fov={40}>
              <color attach="background" args={['#fff1f8']} />
              <hemisphereLight args={['#ffffff', '#ffe0ee', 2.5]} />
              <directionalLight position={[2, 4, 4]} intensity={1.2} />
              <Creature look={getSpecies(evolved).look} anim="pose" />
              <Sparkles count={30} radius={1} height={2} color="#fff3a0" />
            </Stage>
          </div>
          <p className="center"><b>{getSpecies(evolved).name}</b>に なったよ！ ずかんにも とうろく されたよ。</p>
        </Modal>
      )}
      {revert && (
        <Confirm
          title="もとの すがたに もどす？"
          text="レベルと なかよしどは そのままだよ。しんかに つかった そざいは もどらないよ。"
          okLabel="もどす"
          onCancel={() => setRevert(false)}
          onOk={() => {
            setRevert(false);
            apply((s) => revertEvolution(s, f.uid));
          }}
        />
      )}
    </Screen>
  );
}
