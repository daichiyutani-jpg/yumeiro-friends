import { useState } from 'react';
import { EYE_COLORS, HAIR_COLORS, HAIR_STYLES, SKIN_COLORS } from '../game/data/looks';
import type { OutfitSlot, PlayerLook } from '../game/types';
import { useGame } from '../state/store';
import { Heroine } from '../three/Heroine';
import { Stage } from '../three/Stage';

const PRESET_OUTFITS: { name: string; equipped: Record<OutfitSlot, string | null> }[] = [
  { name: 'ピンク × みずいろ', equipped: { top: 'top_pink', bottom: 'bt_skirt_blue', shoes: 'sh_pink', hat: null, accessory: null, tiara: null, dress: null } },
  { name: 'ラベンダー × クリーム', equipped: { top: 'top_lav', bottom: 'bt_shorts', shoes: 'sh_pink', hat: null, accessory: null, tiara: null, dress: null } },
];

export function HeroPreview({ look, equipped, princess }: { look: PlayerLook; equipped: Record<OutfitSlot, string | null>; princess?: boolean }) {
  return (
    <div className="preview-stage">
      <Stage camera={[0, 1.25, 4]} target={[0, 0.95, 0]} fov={40}>
        <color attach="background" args={['#fff1f8']} />
        <hemisphereLight args={['#ffffff', '#e6d8ff', 2.4]} />
        <directionalLight position={[2, 4, 4]} intensity={1.4} />
        <Heroine look={look} equipped={equipped} princess={princess} anim={princess ? 'pose' : 'idle'} position={[0, 0.15, 0]} rotation={[0, 0.2, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}>
          <circleGeometry args={[1.1, 32]} />
          <meshLambertMaterial color="#ffe0ee" />
        </mesh>
      </Stage>
    </div>
  );
}

export function ColorPicker({ colors, value, onChange, label }: { colors: string[]; value: string; onChange: (c: string) => void; label: string }) {
  return (
    <div className="swatches" role="radiogroup" aria-label={label}>
      {colors.map((c, i) => (
        <button key={c} className={`swatch${value === c ? ' on' : ''}`} style={{ background: c }} onClick={() => onChange(c)} aria-label={`${label} ${i + 1}`} aria-checked={value === c} role="radio" />
      ))}
    </div>
  );
}

export function CreateHeroScreen() {
  const newGame = useGame((s) => s.newGame);
  const [look, setLook] = useState<PlayerLook>({ name: '', hairStyle: 'twin', hairColor: HAIR_COLORS[0], eyeColor: EYE_COLORS[0], skinColor: SKIN_COLORS[0] });
  const [outfit, setOutfit] = useState(0);
  const set = (p: Partial<PlayerLook>) => setLook((l) => ({ ...l, ...p }));
  const name = look.name.trim();
  return (
    <div className="screen">
      <div className="topbar">
        <span className="back" />
        <h1>あなたを つくろう</h1>
        <span className="back" />
      </div>
      <div className="screen-main">
      <div className="side">
        <HeroPreview look={look} equipped={PRESET_OUTFITS[outfit].equipped} />
      </div>
      <div className="body">
        <div className="card" style={{ marginTop: 0 }}>
          <label htmlFor="hero-name" style={{ fontWeight: 800 }}>なまえ（8もじ まで）</label>
          <input id="hero-name" className="text-input" maxLength={8} value={look.name} placeholder="れい：ゆめ" onChange={(e) => set({ name: e.target.value })} autoComplete="off" />
          <p className="note">なまえは この たんまつの なかだけに ほぞんされます。ほんとうの なまえで なくて だいじょうぶ。</p>
        </div>
        <div className="section-title">💇 かみがた</div>
        <div className="row wrap">
          {HAIR_STYLES.map((h) => (
            <button key={h.id} className={`choice${look.hairStyle === h.id ? ' on' : ''}`} onClick={() => set({ hairStyle: h.id })}>
              {h.name}
            </button>
          ))}
        </div>
        <div className="section-title">🎨 かみの いろ</div>
        <ColorPicker colors={HAIR_COLORS} value={look.hairColor} onChange={(c) => set({ hairColor: c })} label="かみの いろ" />
        <div className="section-title">👀 めの いろ</div>
        <ColorPicker colors={EYE_COLORS} value={look.eyeColor} onChange={(c) => set({ eyeColor: c })} label="めの いろ" />
        <div className="section-title">🙂 はだの いろ</div>
        <ColorPicker colors={SKIN_COLORS} value={look.skinColor} onChange={(c) => set({ skinColor: c })} label="はだの いろ" />
        <div className="section-title">👚 さいしょの ふく</div>
        <div className="row wrap">
          {PRESET_OUTFITS.map((o, i) => (
            <button key={o.name} className={`choice${outfit === i ? ' on' : ''}`} onClick={() => setOutfit(i)}>
              {o.name}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          <button
            className="btn primary block"
            style={{ minHeight: 60 }}
            disabled={!name}
            onClick={() => {
              newGame({ ...look, name });
              const eq = PRESET_OUTFITS[outfit].equipped;
              useGame.getState().patch((s) => ({ ...s, equipped: { ...eq } }));
            }}
          >
            {name ? 'これで はじめる ✨' : 'なまえを いれてね'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
