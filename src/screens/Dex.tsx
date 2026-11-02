import { useState } from 'react';
import { getItem } from '../game/data/items';
import { ABILITY_INFO, DEX_ORDER, RARITY_INFO, getSpecies } from '../game/data/species';
import { craftFriend } from '../game/logic/friends';
import { hasItems } from '../game/logic/core';
import { useGame } from '../state/store';
import { Confirm, CostList, CreatureIcon, Modal, Paged, Screen, useSave } from '../ui/common';

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
      <div className="row" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: '1.5rem' }}>📖</span>
        <b>なかまに した {owned} / {DEX_ORDER.length}</b>
        <div className="bar grow"><i style={{ width: `${(owned / DEX_ORDER.length) * 100}%` }} /></div>
        <span className="note" style={{ margin: 0 }}>みた {seen}</span>
      </div>
      <Paged
        className="grid c4"
        items={DEX_ORDER.map((s, i) => {
          const st = save.dex[s.id];
          return (
            <button key={s.id} className={`dex-card${st ? '' : ' unknown'}`} onClick={() => setOpen(s.id)}>
              <CreatureIcon look={s.look} size={44} silhouette={!st} />
              <div>No.{i + 1} {st ? s.name : '？？？'}</div>
              {st === 'seen' && <span className="tag" style={{ fontSize: '.62rem' }}>みた</span>}
            </button>
          );
        })}
      />
      {sp && (
        <Modal title={state ? sp.name : '？？？'} onClose={() => setOpen(null)} wide>
          <div className="modal-split">
          <div className="center">
            <CreatureIcon look={sp.look} size={110} silhouette={!state} />
            {sp.craft && (
              <div className="card" style={{ margin: '6px 0 0', padding: 8 }}>
                <b>🔮 そざいで よびかける</b>
                <CostList cost={sp.craft} save={save} />
                <button className="btn primary block small" disabled={!hasItems(save, sp.craft)} onClick={() => setCraft(sp.id)}>
                  よびかける
                </button>
              </div>
            )}
          </div>
          <div style={{ fontSize: '.86rem' }}>
          {state ? (
            <div style={{ lineHeight: 1.6 }}>
              <div className="row wrap">
                <span className="tag pink">{RARITY_INFO[sp.rarity].stars} {RARITY_INFO[sp.rarity].name}</span>
                <span className="tag">{sp.animal} × {sp.theme}</span>
                {[sp.ability, sp.extraAbility].filter((a) => !!a).map((a) => (
                  <span key={a} className="tag sky">{ABILITY_INFO[a!].icon} {ABILITY_INFO[a!].name}</span>
                ))}
              </div>
              <p style={{ margin: '4px 0' }}>{sp.description}</p>
              <div>😊 せいかく：{sp.personality}</div>
              <div>🍽️ すきな たべもの：{getItem(sp.favoriteFood)?.icon} {getItem(sp.favoriteFood)?.name}</div>
              <div>✨ スキル：{sp.skills.join('、')}</div>
              {sp.baseId && <div>🌱 しんかまえ：{getSpecies(sp.baseId).name}</div>}
              {sp.evolutions.length > 0 && <div>🌈 しんかさき：{sp.evolutions.map((e) => (save.dex[e.to] ? getSpecies(e.to).name : '？？？')).join(' / ')}</div>}
            </div>
          ) : (
            <p className="center note">まだ であって いないよ。</p>
          )}
          <p className="note" style={{ margin: '4px 0 0' }}>📍 であいかた：{sp.unlock}</p>
          </div>
          </div>
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
