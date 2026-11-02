import { useFrame, type ThreeElements } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { getOutfit } from '../game/data/catalog';
import type { OutfitSlot, PlayerLook } from '../game/types';
import { Sparkles } from './Effects';
import { cgeo, charMat, geo, mat, shadowMat, type CharKind } from './shared';

type V3 = [number, number, number];
function P({ g, c, k = 'cloth', p, s, r, e }: { g: THREE.BufferGeometry; c: string; k?: CharKind; p: V3; s: number | V3; r?: V3; e?: string }) {
  return <mesh geometry={g} material={charMat(c, k, e)} position={p} scale={typeof s === 'number' ? [s, s, s] : s} rotation={r} />;
}

// あたまの 大きさと 位置（顔の パーツは ここに あわせて 表面に のせる）
const HEAD = { y: 1.45, rx: 0.2, ry: 0.215, rz: 0.195 };
/** あたまの 表面の z（顔の パーツを うかせず めりこませず 置くため） */
function faceZ(x: number, y: number, lift = 0): number {
  const v = 1 - ((y - HEAD.y) / HEAD.ry) ** 2 - (x / HEAD.rx) ** 2;
  return HEAD.rz * Math.sqrt(Math.max(0, v)) + lift;
}

function Face({ look }: { look: PlayerLook }) {
  const skin = look.skinColor;
  return (
    <>
      <P g={cgeo.sphere} c={skin} k="skin" p={[0, HEAD.y, 0]} s={[HEAD.rx, HEAD.ry, HEAD.rz]} />
      {/* みみ */}
      {[-1, 1].map((d) => (
        <P key={`ear${d}`} g={cgeo.sphere} c={skin} k="skin" p={[d * 0.196, 1.43, -0.005]} s={[0.028, 0.044, 0.024]} />
      ))}
      {/* め：しろめ → ひとみ → どうこう → ひかり、うえに まつげ */}
      {[-1, 1].map((d) => (
        <group key={`eye${d}`} position={[d * 0.074, 1.425, faceZ(d * 0.074, 1.425, -0.018)]} rotation={[0, d * 0.36, 0]}>
          <P g={cgeo.sphere} c="#ffffff" k="gloss" p={[0, 0, 0.008]} s={[0.04, 0.048, 0.02]} />
          <P g={cgeo.sphere} c={look.eyeColor} k="gloss" p={[0, -0.004, 0.02]} s={[0.031, 0.039, 0.012]} />
          <P g={cgeo.sphere} c="#2a1a32" k="gloss" p={[0, -0.006, 0.028]} s={[0.016, 0.021, 0.007]} />
          <mesh geometry={cgeo.sphere} material={mat('#ffffff', { emissive: '#ffffff' })} position={[d * -0.01, 0.013, 0.033]} scale={0.008} />
          <mesh geometry={cgeo.sphere} material={mat('#ffffff', { emissive: '#ffffff' })} position={[d * 0.009, -0.018, 0.031]} scale={0.0045} />
          <P g={cgeo.arc} c="#3a2430" k="skin" p={[0, 0.002, 0.016]} s={[0.043, 0.05, 0.03]} />
          <P g={cgeo.capsule} c="#3a2430" k="skin" p={[d * 0.044, 0.018, 0.012]} s={[0.008, 0.02, 0.008]} r={[0, 0, -d * 0.9]} />
        </group>
      ))}
      {/* まゆ */}
      {[-1, 1].map((d) => (
        <P key={`brow${d}`} g={cgeo.arc} c={look.hairColor} k="hair" p={[d * 0.074, 1.5, faceZ(d * 0.074, 1.5, 0.004)]} s={[0.034, 0.012, 0.02]} r={[0, d * 0.36, 0]} />
      ))}
      {/* はな・くち・ほっぺ */}
      <P g={cgeo.sphere} c={skin} k="skin" p={[0, 1.39, faceZ(0, 1.39, 0.002)]} s={[0.013, 0.015, 0.012]} />
      <P g={cgeo.arc} c="#d65d7f" k="skin" p={[0, 1.352, faceZ(0, 1.352, 0.001)]} s={[0.022, 0.017, 0.02]} r={[0.25, 0, Math.PI]} />
      {[-1, 1].map((d) => (
        <mesh
          key={`cheek${d}`}
          geometry={cgeo.sphere}
          material={mat('#ff9fbd', { transparent: 0.45 })}
          position={[d * 0.112, 1.378, faceZ(d * 0.112, 1.378, -0.004)]}
          scale={[0.034, 0.018, 0.01]}
          rotation={[0, d * 0.55, 0]}
        />
      ))}
      {/* くび */}
      <P g={cgeo.cylinder} c={skin} k="skin" p={[0, 1.225, 0]} s={[0.042, 0.12, 0.04]} />
    </>
  );
}

function Hair({ look }: { look: PlayerLook }) {
  const c = look.hairColor;
  const common = (
    <>
      {/* あたまの うえ（まえがわを すこし あげて おでこを だす） */}
      <P g={cgeo.cap} c={c} k="hair" p={[0, 1.455, -0.008]} s={[0.214, 0.23, 0.212]} r={[-0.34, 0, 0]} />
      {/* うしろ と よこの ボリューム */}
      <P g={cgeo.sphere} c={c} k="hair" p={[0, 1.42, -0.048]} s={[0.218, 0.226, 0.204]} />
      {/* まえがみ（毛束を 5つ） */}
      {[-2, -1, 0, 1, 2].map((i) => {
        const x = i * 0.056;
        const y = 1.548 - Math.abs(i) * 0.014;
        return <P key={`bang${i}`} g={cgeo.capsule} c={c} k="hair" p={[x, y, faceZ(x, y, 0.006)]} s={[0.052, 0.075, 0.03]} r={[-0.5, i * 0.1, -i * 0.2]} />;
      })}
      {/* かおの よこの 毛 */}
      {[-1, 1].map((d) => (
        <P key={`side${d}`} g={cgeo.capsule} c={c} k="hair" p={[d * 0.182, 1.36, 0.05]} s={[0.045, 0.2, 0.04]} r={[0.12, 0, d * 0.08]} />
      ))}
    </>
  );
  switch (look.hairStyle) {
    case 'long':
      return (
        <>
          {common}
          <P g={cgeo.capsule} c={c} k="hair" p={[0, 1.17, -0.125]} s={[0.34, 0.4, 0.12]} r={[0.12, 0, 0]} />
          {[-1, 1].map((d) => (
            <P key={d} g={cgeo.capsule} c={c} k="hair" p={[d * 0.16, 1.14, -0.075]} s={[0.1, 0.36, 0.08]} r={[0.1, 0, d * 0.06]} />
          ))}
        </>
      );
    case 'twin':
      return (
        <>
          {common}
          {[-1, 1].map((d) => (
            <group key={d} position={[d * 0.2, 1.55, -0.08]} rotation={[0.15, 0, d * 0.32]}>
              <P g={cgeo.sphere} c="#ff8fbf" k="satin" p={[0, 0, 0]} s={0.042} />
              <P g={cgeo.capsule} c={c} k="hair" p={[0, -0.2, -0.01]} s={[0.12, 0.3, 0.11]} />
              <P g={cgeo.capsule} c={c} k="hair" p={[0.012 * d, -0.42, -0.02]} s={[0.075, 0.16, 0.07]} r={[0, 0, -d * 0.2]} />
            </group>
          ))}
        </>
      );
    case 'bob':
      return (
        <>
          {common}
          <P g={cgeo.sphere} c={c} k="hair" p={[0, 1.36, -0.08]} s={[0.25, 0.19, 0.2]} />
          {[-1, 1].map((d) => (
            <P key={d} g={cgeo.capsule} c={c} k="hair" p={[d * 0.19, 1.32, 0.02]} s={[0.075, 0.13, 0.07]} r={[0, 0, -d * 0.15]} />
          ))}
        </>
      );
    case 'bun':
      return (
        <>
          {common}
          <P g={cgeo.sphere} c={c} k="hair" p={[0, 1.69, -0.08]} s={0.105} />
          <P g={cgeo.arc} c="#ff8fbf" k="satin" p={[0, 1.63, -0.04]} s={[0.075, 0.075, 0.08]} r={[-1.1, 0, 0]} />
        </>
      );
  }
}

/** うで（かたから さげて、ひじで すこし まえに まげる） */
function Arm({ d, skin, sleeve, puff }: { d: number; skin: string; sleeve: string; puff?: boolean }) {
  return (
    <group position={[d * 0.148, 1.15, 0]} rotation={[0, 0, d * 0.1]}>
      <P g={cgeo.sphere} c={sleeve} p={[0, -0.02, 0]} s={puff ? 0.08 : 0.058} />
      <P g={cgeo.capsule} c={sleeve} p={[0, -0.07, 0]} s={[0.07, 0.07, 0.07]} />
      <P g={cgeo.capsule} c={skin} k="skin" p={[0, -0.14, 0]} s={[0.062, 0.15, 0.062]} />
      <group position={[0, -0.25, 0]} rotation={[-0.18, 0, -d * 0.05]}>
        <P g={cgeo.sphere} c={skin} k="skin" p={[0, 0, 0]} s={0.027} />
        <P g={cgeo.capsule} c={skin} k="skin" p={[0, -0.11, 0]} s={[0.054, 0.16, 0.054]} />
        <P g={cgeo.sphere} c={skin} k="skin" p={[0, -0.225, 0.006]} s={[0.032, 0.044, 0.026]} />
      </group>
    </group>
  );
}

function Clothes({ equipped, skin }: { equipped: Record<OutfitSlot, string | null>; skin: string }) {
  const top = getOutfit(equipped.top);
  const bottom = getOutfit(equipped.bottom);
  const shoes = getOutfit(equipped.shoes);
  const hat = getOutfit(equipped.hat);
  const acc = getOutfit(equipped.accessory);
  const tiara = getOutfit(equipped.tiara);
  const dress = getOutfit(equipped.dress);
  const shoeColor = shoes?.color ?? '#ff8fbf';
  const bodyColor = dress?.color ?? top?.color ?? '#ffb3d1';
  return (
    <>
      {/* あし（ふともも・すね・ひざ）と くつした */}
      {[-1, 1].map((d) => (
        <group key={d}>
          <P g={cgeo.capsule} c={skin} k="skin" p={[d * 0.064, 0.66, 0]} s={[0.094, 0.24, 0.094]} />
          <P g={cgeo.sphere} c={skin} k="skin" p={[d * 0.063, 0.5, 0.006]} s={0.04} />
          <P g={cgeo.capsule} c={skin} k="skin" p={[d * 0.062, 0.31, 0]} s={[0.074, 0.3, 0.074]} />
          <P g={cgeo.cylinder} c="#ffffff" p={[d * 0.062, 0.135, 0]} s={[0.036, 0.09, 0.036]} />
          {shoes?.shape === 'boot' ? (
            <>
              <P g={cgeo.cylinder} c={shoeColor} k="satin" p={[d * 0.062, 0.14, 0]} s={[0.047, 0.22, 0.05]} />
              <P g={cgeo.sphere} c={shoeColor} k="satin" p={[d * 0.062, 0.04, 0.025]} s={[0.05, 0.04, 0.085]} />
            </>
          ) : (
            <>
              <P g={cgeo.sphere} c={shoeColor} k="satin" p={[d * 0.062, 0.042, 0.022]} s={[0.048, 0.042, 0.082]} e={shoes?.princess ? '#305060' : undefined} />
              <P g={cgeo.cylinder} c={shoeColor} k="satin" p={[d * 0.062, 0.075, 0.01]} s={[0.04, 0.008, 0.04]} />
            </>
          )}
        </group>
      ))}
      {dress ? (
        <>
          {/* プリンセスドレス：むね・ふんわりスカート・うわかさね・こしの リボン */}
          <group position={[0, 1.0, 0]} scale={[1, 1, 0.8]}>
            <mesh geometry={cgeo.torso} material={charMat(dress.color, 'satin')} />
          </group>
          <mesh geometry={cgeo.gown} material={charMat(dress.color, 'satin')} />
          <mesh geometry={cgeo.overskirt} material={charMat(dress.color2 ?? '#ffffff', 'cloth')} rotation={[0, 0.3, 0]} />
          <P g={cgeo.arc} c={dress.color2 ?? '#ffffff'} k="satin" p={[0, 0.865, 0.105]} s={[0.07, 0.05, 0.05]} r={[0, 0, Math.PI / 2]} />
          <mesh geometry={cgeo.sphere} material={charMat(dress.color2 ?? '#ffffff', 'satin')} position={[0, 0.865, 0.11]} scale={0.026} />
          <mesh geometry={cgeo.sphere} material={charMat(dress.color2 ?? '#ffffff', 'satin')} position={[0, 1.15, 0.095]} scale={[0.05, 0.03, 0.02]} />
        </>
      ) : top?.shape === 'onepiece' ? (
        <>
          <group position={[0, 1.0, 0]} scale={[1, 1, 0.8]}>
            <mesh geometry={cgeo.torso} material={charMat(top.color, 'cloth')} />
          </group>
          <mesh geometry={cgeo.onepiece} material={charMat(top.color, 'cloth')} position={[0, 0.5, 0]} scale={[1, 1, 0.86]} />
          <P g={cgeo.cylinder} c={top.color2 ?? '#ffffff'} p={[0, 0.515, 0]} s={[0.262, 0.03, 0.228]} />
        </>
      ) : (
        <>
          <group position={[0, 1.0, 0]} scale={[1, 1, 0.8]}>
            <mesh geometry={cgeo.torso} material={charMat(top?.color ?? '#ffb3d1', 'cloth')} />
          </group>
          {top?.shape === 'blouse' && (
            <>
              <P g={cgeo.arc} c={top.color2 ?? '#ffffff'} p={[0, 1.165, 0.082]} s={[0.05, 0.04, 0.04]} r={[0.5, 0, Math.PI]} />
              <P g={cgeo.sphere} c={top.color2 ?? '#ffffff'} k="satin" p={[0, 1.13, 0.1]} s={[0.03, 0.02, 0.015]} />
            </>
          )}
          {bottom?.shape === 'shorts' ? (
            <>
              <P g={cgeo.cylinder} c={bottom.color} p={[0, 0.84, 0]} s={[0.122, 0.11, 0.1]} />
              {[-1, 1].map((d) => <P key={d} g={cgeo.cylinder} c={bottom.color} p={[d * 0.066, 0.74, 0]} s={[0.07, 0.15, 0.07]} />)}
            </>
          ) : (
            <>
              <mesh geometry={cgeo.skirt} material={charMat(bottom?.color ?? '#9fd8ff', 'cloth')} position={[0, 0.6, 0]} scale={[1, 1, 0.86]} />
              {bottom?.color2 && <P g={cgeo.cylinder} c={bottom.color2} p={[0, 0.6, 0]} s={[0.242, 0.03, 0.21]} />}
            </>
          )}
        </>
      )}
      {[-1, 1].map((d) => (
        <Arm key={`a${d}`} d={d} skin={skin} sleeve={bodyColor} puff={!!dress || top?.shape === 'blouse'} />
      ))}
      {hat?.shape === 'brim' && (
        <group position={[0, 1.625, -0.01]} rotation={[-0.14, 0, 0.06]}>
          <P g={cgeo.cylinder} c={hat.color} p={[0, 0, 0]} s={[0.33, 0.016, 0.33]} />
          <P g={cgeo.sphere} c={hat.color} p={[0, 0.045, 0]} s={[0.215, 0.13, 0.215]} />
          <P g={cgeo.cylinder} c={hat.color2 ?? '#ff8fbf'} k="satin" p={[0, 0.035, 0]} s={[0.218, 0.035, 0.218]} />
        </group>
      )}
      {hat?.shape === 'beret' && <P g={cgeo.sphere} c={hat.color} p={[0.04, 1.65, -0.03]} s={[0.25, 0.08, 0.24]} r={[-0.15, 0, -0.25]} />}
      {hat?.shape === 'wreath' && (
        <group position={[0, 1.6, -0.01]} rotation={[-0.3, 0, 0]}>
          {Array.from({ length: 10 }, (_, i) => (
            <P key={i} g={cgeo.sphere} c={i % 2 ? hat.color : (hat.color2 ?? '#fff')} k="satin" p={[Math.cos((i / 10) * Math.PI * 2) * 0.205, 0, Math.sin((i / 10) * Math.PI * 2) * 0.205]} s={0.042} />
          ))}
        </group>
      )}
      {tiara && (
        <group position={[0, 1.635, 0.03]} rotation={[-0.4, 0, 0]}>
          <P g={cgeo.arc} c={tiara.color} k="gloss" p={[0, 0, 0]} s={[0.15, 0.15, 0.15]} r={[Math.PI / 2, Math.PI, 0]} e="#5a4a00" />
          {[-1, 0, 1].map((d) => (
            <P key={d} g={cgeo.cone} c={tiara.color} k="gloss" p={[d * 0.08, 0.04, 0.13 - Math.abs(d) * 0.035]} s={[0.022, d === 0 ? 0.1 : 0.065, 0.022]} e="#5a4a00" />
          ))}
          <mesh geometry={cgeo.sphere} material={charMat(tiara.color2 ?? '#ff8fbf', 'gloss', '#401030')} position={[0, 0.03, 0.15]} scale={[0.028, 0.034, 0.02]} />
        </group>
      )}
      {acc?.shape === 'necklace' && (
        <>
          <P g={cgeo.arc} c={acc.color} k="gloss" p={[0, 1.19, 0.03]} s={[0.075, 0.075, 0.08]} r={[1.15, 0, Math.PI]} />
          <mesh geometry={cgeo.sphere} material={charMat(acc.color, 'gloss', '#6a5a00')} position={[0, 1.115, 0.098]} scale={0.022} />
        </>
      )}
      {acc?.shape === 'bag' && (
        <>
          <P g={cgeo.capsule} c={acc.color} k="satin" p={[0.19, 0.8, 0.04]} s={[0.1, 0.06, 0.05]} r={[0, 0, Math.PI / 2]} />
          <P g={cgeo.cylinder} c={acc.color} p={[0.03, 1.0, 0.07]} s={[0.006, 0.42, 0.006]} r={[0, 0, 0.78]} />
        </>
      )}
      {acc?.shape === 'wand' && (
        <group position={[0.22, 0.68, 0.07]} rotation={[0.4, 0, -0.25]}>
          <P g={cgeo.cylinder} c="#ffffff" k="gloss" p={[0, 0.06, 0]} s={[0.011, 0.3, 0.011]} />
          <mesh geometry={cgeo.sphere} material={charMat(acc.color, 'gloss', '#6a5a00')} position={[0, 0.23, 0]} scale={0.04} />
        </group>
      )}
    </>
  );
}

export function HeroineModel({ look, equipped }: { look: PlayerLook; equipped: Record<OutfitSlot, string | null> }) {
  return (
    <group>
      <Clothes equipped={equipped} skin={look.skinColor} />
      <Face look={look} />
      <Hair look={look} />
    </group>
  );
}

export type HeroAnim = 'idle' | 'walk' | 'pose';

export function Heroine({
  look, equipped, princess, anim = 'idle', animRef, ...props
}: { look: PlayerLook; equipped: Record<OutfitSlot, string | null>; princess?: boolean; anim?: HeroAnim; animRef?: { current: HeroAnim } } & ThreeElements['group']) {
  const inner = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = inner.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const a = animRef?.current ?? anim;
    g.position.y = 0;
    g.rotation.set(0, 0, 0);
    if (a === 'walk') {
      g.position.y = Math.abs(Math.sin(t * 10)) * 0.05;
      g.rotation.z = Math.sin(t * 10) * 0.03;
    } else if (a === 'pose') {
      g.rotation.y = Math.sin(t * 2) * 0.5;
      g.position.y = Math.abs(Math.sin(t * 3)) * 0.1;
    } else {
      g.position.y = Math.sin(t * 2) * 0.008;
    }
  });
  return (
    <group {...props}>
      <mesh geometry={geo.circle} material={shadowMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} scale={princess ? 0.6 : 0.32} />
      <group ref={inner}>
        <HeroineModel look={look} equipped={equipped} />
      </group>
      {princess && <Sparkles count={24} radius={0.8} height={1.8} color="#fff3a0" />}
    </group>
  );
}
