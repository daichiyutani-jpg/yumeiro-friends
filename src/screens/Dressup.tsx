import { useState } from 'react';
import { OUTFITS, SLOT_INFO, SLOT_ORDER } from '../game/data/catalog';
import { EYE_COLORS, HAIR_COLORS, HAIR_STYLES, SKIN_COLORS } from '../game/data/looks';
import { canTransform, equip, princessParts, transform, updateLook } from '../game/logic/shop';
import type { OutfitSlot } from '../game/types';
import { useGame } from '../state/store';
import { Modal, Paged, Screen, useSave } from '../ui/common';
import { ColorPicker, HeroPreview } from './CreateHero';

/** タブに おさまる みじかい なまえ */
const SLOT_SHORT: Record<OutfitSlot, string> = { top: 'トップス', bottom: 'ボトムス', shoes: 'くつ', hat: 'ぼうし', accessory: 'アクセ', tiara: 'ティアラ', dress: 'ドレス' };

function PrincessCard() {
  const save = useSave();
  const apply = useGame((s) => s.apply);
  const [transformed, setTransformed] = useState(false);
  const parts = princessParts(save);
  const canPrincess = canTransform(save);
  return (
    <div className="card princess-card" style={{ background: save.princess ? '#fff3fa' : undefined }}>
      <div className="row">
        <span style={{ fontSize: '1.4rem' }}>👑</span>
        <div className="grow" style={{ fontSize: '.8rem' }}>
          <b>プリンセス へんしん</b>
          <div className="muted">ドレス {parts.dress ? '✔' : '✖'} ・ ティアラ {parts.tiara ? '✔' : '✖'} ・ ガラスのくつ {parts.shoes ? '✔' : '✖'}</div>
        </div>
      </div>
      {save.princess ? (
        <button className="btn small block" onClick={() => apply((s) => transform(s, false))}>もとの すがたに もどる</button>
      ) : (
        <button
          className="btn primary small block"
          disabled={!canPrincess}
          onClick={() => {
            const r = apply((s) => transform(s, true), { sound: 'fanfare' });
            if (r?.ok) setTransformed(true);
          }}
        >
          {canPrincess ? '✨ プリンセスに へんしん！' : 'そろうと へんしん できるよ'}
        </button>
      )}
      {!canPrincess && <div className="muted" style={{ fontSize: '.72rem', marginTop: 4 }}>ティアラは 森の たからばこ、ドレスと くつは アトリエで つくれるよ</div>}
      {transformed && (
        <Modal title="プリンセスに へんしん！" onClose={() => setTransformed(false)} closeLabel="すてき！">
          <HeroPreview look={save.player} equipped={save.equipped} princess />
          <p className="center" style={{ margin: '6px 0 0' }}>キラキラ… ✨ プリンセスの すがたで ぼうけんにも いけるよ！</p>
        </Modal>
      )}
    </div>
  );
}

export function DressupScreen() {
  const save = useSave();
  const apply = useGame((s) => s.apply);
  const [slot, setSlot] = useState<OutfitSlot | 'look'>('top');
  const owned = OUTFITS.filter((o) => save.ownedOutfits.includes(o.id));
  const inSlot = slot === 'look' ? [] : owned.filter((o) => o.slot === slot);

  const side = (
    <>
      <HeroPreview look={save.player} equipped={save.equipped} princess={save.princess} />
      <PrincessCard />
    </>
  );

  return (
    <Screen title="きせかえ" side={side}>
      <div className="edit-tabs slot-tabs">
        {SLOT_ORDER.map((s) => (
          <button key={s} className={`btn small${slot === s ? ' on' : ''}`} onClick={() => setSlot(s)}>
            <span className="ic">{SLOT_INFO[s].icon}</span>
            {SLOT_SHORT[s]}
          </button>
        ))}
        <button className={`btn small${slot === 'look' ? ' on' : ''}`} onClick={() => setSlot('look')}>
          <span className="ic">💇</span>かみ・いろ
        </button>
      </div>

      {slot !== 'look' ? (
        <>
          {slot === 'top' && save.equipped.dress && <p className="note" style={{ marginTop: 0 }}>いまは ドレスを きているので、トップスは かくれているよ。</p>}
          {inSlot.length === 0 && <p className="note">まだ もっていないよ。おみせ や たからばこで てに いれよう。</p>}
          <Paged
            className="grid c2"
            resetKey={slot}
            items={[
              ...(slot !== 'top' && slot !== 'shoes'
                ? [
                    <button key="none" className={`choice${save.equipped[slot] === null ? ' on' : ''}`} onClick={() => apply((s) => equip(s, slot, null), { quiet: true })}>
                      ✖ つけない
                    </button>,
                  ]
                : []),
              ...inSlot.map((o) => (
                <button key={o.id} className={`choice${save.equipped[slot] === o.id ? ' on' : ''}`} onClick={() => apply((s) => equip(s, slot, o.id), { quiet: true })}>
                  <span style={{ fontSize: '1.4rem' }}>{o.icon}</span> {o.name}
                  {save.equipped[slot] === o.id && <span className="tag pink" style={{ marginLeft: 4 }}>きてる</span>}
                </button>
              )),
            ]}
          />
          <p className="note" style={{ margin: '4px 4px 0' }}>もっている ふく：{owned.length} / {OUTFITS.length}</p>
        </>
      ) : (
        <div className="look-edit">
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
        </div>
      )}
    </Screen>
  );
}
