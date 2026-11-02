import { useState } from 'react';
import { OUTFITS, SLOT_INFO, SLOT_ORDER } from '../game/data/catalog';
import { EYE_COLORS, HAIR_COLORS, HAIR_STYLES, SKIN_COLORS } from '../game/data/looks';
import { canTransform, equip, princessParts, transform, updateLook } from '../game/logic/shop';
import type { OutfitSlot } from '../game/types';
import { useGame } from '../state/store';
import { Modal, Screen, useSave } from '../ui/common';
import { ColorPicker, HeroPreview } from './CreateHero';

export function DressupScreen() {
  const save = useSave();
  const apply = useGame((s) => s.apply);
  const [slot, setSlot] = useState<OutfitSlot | 'look'>('top');
  const [transformed, setTransformed] = useState(false);
  const owned = OUTFITS.filter((o) => save.ownedOutfits.includes(o.id));
  const parts = princessParts(save);
  const canPrincess = canTransform(save);

  return (
    <Screen title="きせかえ">
      <HeroPreview look={save.player} equipped={save.equipped} princess={save.princess} />
      <div className="card" style={{ marginTop: 10, background: save.princess ? '#fff3fa' : undefined }}>
        <div className="row">
          <span style={{ fontSize: '1.8rem' }}>👑</span>
          <div className="grow">
            <b>プリンセス へんしん</b>
            <div className="note" style={{ margin: 0 }}>
              ドレス {parts.dress ? '✔' : '✖'} ・ ティアラ {parts.tiara ? '✔' : '✖'} ・ ガラスのくつ {parts.shoes ? '✔' : '✖'}
            </div>
          </div>
        </div>
        {save.princess ? (
          <button className="btn block" style={{ marginTop: 8 }} onClick={() => apply((s) => transform(s, false))}>もとの すがたに もどる</button>
        ) : (
          <button
            className="btn primary block"
            style={{ marginTop: 8 }}
            disabled={!canPrincess}
            onClick={() => {
              const r = apply((s) => transform(s, true), { sound: 'fanfare' });
              if (r?.ok) setTransformed(true);
            }}
          >
            {canPrincess ? '✨ プリンセスに へんしん！' : 'そろうと へんしん できるよ'}
          </button>
        )}
        {!canPrincess && <p className="note">ティアラは さくらの森の たからばこ、ドレスと くつは「おみせ」の アトリエで つくれるよ。</p>}
      </div>

      <div className="tabs">
        {SLOT_ORDER.map((s) => (
          <button key={s} className={`btn small${slot === s ? ' on' : ''}`} onClick={() => setSlot(s)}>
            {SLOT_INFO[s].icon} {SLOT_INFO[s].name}
          </button>
        ))}
        <button className={`btn small${slot === 'look' ? ' on' : ''}`} onClick={() => setSlot('look')}>💇 かみ・いろ</button>
      </div>

      {slot !== 'look' ? (
        <div className="grid c2">
          {slot !== 'top' && slot !== 'shoes' && (
            <button className={`choice${save.equipped[slot] === null ? ' on' : ''}`} onClick={() => apply((s) => equip(s, slot, null), { quiet: true })}>
              ✖ つけない
            </button>
          )}
          {owned.filter((o) => o.slot === slot).map((o) => (
            <button key={o.id} className={`choice${save.equipped[slot] === o.id ? ' on' : ''}`} onClick={() => apply((s) => equip(s, slot, o.id), { quiet: true })}>
              <span style={{ fontSize: '1.4rem' }}>{o.icon}</span> {o.name}
              {save.equipped[slot] === o.id && <span className="tag pink" style={{ marginLeft: 4 }}>きてる</span>}
            </button>
          ))}
          {owned.filter((o) => o.slot === slot).length === 0 && <p className="note">まだ もっていないよ。おみせ や たからばこで てに いれよう。</p>}
          {slot === 'top' && save.equipped.dress && <p className="note">いまは ドレスを きているので、トップスは かくれているよ。</p>}
        </div>
      ) : (
        <>
          <div className="row wrap">
            {HAIR_STYLES.map((h) => (
              <button key={h.id} className={`choice${save.player.hairStyle === h.id ? ' on' : ''}`} onClick={() => apply((s) => updateLook(s, { hairStyle: h.id }), { quiet: true })}>
                {h.name}
              </button>
            ))}
          </div>
          <div className="section-title">かみの いろ</div>
          <ColorPicker colors={HAIR_COLORS} value={save.player.hairColor} label="かみの いろ" onChange={(c) => apply((s) => updateLook(s, { hairColor: c }), { quiet: true })} />
          <div className="section-title">めの いろ</div>
          <ColorPicker colors={EYE_COLORS} value={save.player.eyeColor} label="めの いろ" onChange={(c) => apply((s) => updateLook(s, { eyeColor: c }), { quiet: true })} />
          <div className="section-title">はだの いろ</div>
          <ColorPicker colors={SKIN_COLORS} value={save.player.skinColor} label="はだの いろ" onChange={(c) => apply((s) => updateLook(s, { skinColor: c }), { quiet: true })} />
        </>
      )}
      <p className="note">もっている ふく：{owned.length} / {OUTFITS.length}</p>
      {transformed && (
        <Modal title="プリンセスに へんしん！" onClose={() => setTransformed(false)} closeLabel="すてき！">
          <HeroPreview look={save.player} equipped={save.equipped} princess />
          <p className="center">キラキラ… ✨ プリンセスの すがたで ぼうけんにも いけるよ！</p>
        </Modal>
      )}
    </Screen>
  );
}
