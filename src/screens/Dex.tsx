import { useState } from 'react';
import { getItem } from '../game/data/items';
import { ABILITY_INFO, DEX_ORDER, RARITY_INFO, getSpecies } from '../game/data/species';
import { craftFriend } from '../game/logic/friends';
import { hasItems } from '../game/logic/core';
import { useGame } from '../state/store';
import { Confirm, CostList, CreatureIcon, Modal, Screen, useSave } from '../ui/common';

export function DexScreen() {
  const save = useSave();
  const apply = useGame((s) => s.apply);
  const [open, setOpen] = useState<string | null>(null);
  const [craft, setCraft] = useState<string | null>(null);
  const owned = DEX_ORDER.filter((s) => save.dex[s.id] === 'owned').length;
  const seen = DEX_ORDER.filter((s) => save.dex[s.id]).length;
  const sp = open ? getSpecies(open) : null;
  const state = open ? save.dex[open] : undefined;
  return (
    <Screen title="ずかん">
      <div className="card row">
        <span style={{ fontSize: '2rem' }}>📖</span>
        <div className="grow">
          <b>なかまに した {owned} / {DEX_ORDER.length}</b>
          <div className="note" style={{ margin: 0 }}>みたことが ある {seen}（しんかの すがた も ふくむ）</div>
          <div className="bar" style={{ marginTop: 6 }}><i style={{ width: `${(owned / DEX_ORDER.length) * 100}%` }} /></div>
        </div>
      </div>
      <div className="grid c4">
        {DEX_ORDER.map((s, i) => {
          const st = save.dex[s.id];
          return (
            <button key={s.id} className={`dex-card${st ? '' : ' unknown'}`} onClick={() => setOpen(s.id)}>
              <CreatureIcon look={s.look} size={52} silhouette={!st} />
              <div>No.{i + 1}</div>
              <div>{st ? s.name : '？？？'}</div>
              {st === 'seen' && <span className="tag" style={{ fontSize: '.66rem' }}>みた</span>}
            </button>
          );
        })}
      </div>
      {sp && (
        <Modal title={state ? sp.name : '？？？'} onClose={() => setOpen(null)}>
          <div className="center"><CreatureIcon look={sp.look} size={120} silhouette={!state} /></div>
          {state ? (
            <div style={{ lineHeight: 1.8 }}>
              <div className="row wrap">
                <span className="tag pink">{RARITY_INFO[sp.rarity].stars} {RARITY_INFO[sp.rarity].name}</span>
                <span className="tag">{sp.animal} × {sp.theme}</span>
                {[sp.ability, sp.extraAbility].filter((a) => !!a).map((a) => (
                  <span key={a} className="tag sky">{ABILITY_INFO[a!].icon} {ABILITY_INFO[a!].name}</span>
                ))}
              </div>
              <p>{sp.description}</p>
              <div>😊 せいかく：{sp.personality}</div>
              <div>🍽️ すきな たべもの：{getItem(sp.favoriteFood)?.icon} {getItem(sp.favoriteFood)?.name}</div>
              <div>✨ スキル：{sp.skills.join('、')}</div>
              {sp.baseId && <div>🌱 しんかまえ：{getSpecies(sp.baseId).name}</div>}
              {sp.evolutions.length > 0 && <div>🌈 しんかさき：{sp.evolutions.map((e) => (save.dex[e.to] ? getSpecies(e.to).name : '？？？')).join(' / ')}</div>}
            </div>
          ) : (
            <p className="center note">まだ であって いないよ。</p>
          )}
          <p className="note">📍 であいかた：{sp.unlock}</p>
          {sp.craft && (
            <div className="card">
              <b>🔮 そざいで よびかける</b>
              <CostList cost={sp.craft} save={save} />
              <button className="btn primary block" disabled={!hasItems(save, sp.craft)} onClick={() => setCraft(sp.id)}>
                よびかける
              </button>
            </div>
          )}
        </Modal>
      )}
      {craft && (
        <Confirm
          title="なかまに よびかける？"
          text={`そざいを つかって ${getSpecies(craft).name} を よびます。`}
          cost={getSpecies(craft).craft}
          onCancel={() => setCraft(null)}
          onOk={() => {
            const id = craft;
            setCraft(null);
            setOpen(null);
            apply((s) => craftFriend(s, id), { sound: 'fanfare' });
          }}
        />
      )}
    </Screen>
  );
}
