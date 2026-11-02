import { useFrame, type ThreeElements } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { getOutfit } from '../game/data/catalog';
import type { OutfitSlot, PlayerLook } from '../game/types';
import { Sparkles } from './Effects';
import { geo, mat, shadowMat } from './shared';

type V3 = [number, number, number];
function P({ g, c, p, s, r, e }: { g: THREE.BufferGeometry; c: string; p: V3; s: number | V3; r?: V3; e?: string }) {
  return <mesh geometry={g} material={mat(c, { emissive: e })} position={p} scale={typeof s === 'number' ? [s, s, s] : s} rotation={r} />;
}

function Hair({ look }: { look: PlayerLook }) {
  const c = look.hairColor;
  const common = (
    <>
      <P g={geo.sphere} c={c} p={[0, 1.4, -0.1]} s={[0.315, 0.31, 0.27]} />
      {/* まえがみ */}
      <P g={geo.sphere} c={c} p={[0, 1.55, 0.08]} s={[0.29, 0.12, 0.2]} />
    </>
  );
  switch (look.hairStyle) {
    case 'long':
      return (
        <>
          {common}
          <P g={geo.sphere} c={c} p={[0, 1.1, -0.14]} s={[0.3, 0.42, 0.18]} />
        </>
      );
    case 'twin':
      return (
        <>
          {common}
          {[-1, 1].map((d) => (
            <group key={d}>
              <P g={geo.sphere} c={c} p={[d * 0.36, 1.2, -0.05]} s={[0.12, 0.28, 0.12]} r={[0, 0, d * 0.25]} />
              <P g={geo.sphere} c="#ff8fbf" p={[d * 0.3, 1.45, -0.03]} s={0.05} />
            </group>
          ))}
        </>
      );
    case 'bob':
      return (
        <>
          {common}
          <P g={geo.sphere} c={c} p={[0, 1.3, -0.06]} s={[0.37, 0.3, 0.3]} />
        </>
      );
    case 'bun':
      return (
        <>
          {common}
          <P g={geo.sphere} c={c} p={[0, 1.72, -0.08]} s={0.14} />
          <P g={geo.torus} c="#ff8fbf" p={[0, 1.64, -0.07]} s={[0.1, 0.1, 0.1]} r={[Math.PI / 2, 0, 0]} />
        </>
      );
  }
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
  return (
    <>
      {/* あし */}
      {[-1, 1].map((d) => (
        <group key={d}>
          <P g={geo.cylinder} c={skin} p={[d * 0.09, 0.3, 0]} s={[0.055, 0.5, 0.055]} />
          {shoes?.shape === 'boot' ? (
            <P g={geo.cylinder} c={shoeColor} p={[d * 0.09, 0.14, 0.01]} s={[0.075, 0.24, 0.08]} />
          ) : (
            <P g={geo.sphere} c={shoeColor} p={[d * 0.09, 0.05, 0.04]} s={[0.075, 0.055, 0.12]} e={shoes?.princess ? '#406070' : undefined} />
          )}
        </group>
      ))}
      {dress ? (
        <>
          <P g={geo.cone} c={dress.color} p={[0, 0.48, 0]} s={[0.55, 0.9, 0.55]} />
          <P g={geo.cone} c={dress.color2 ?? '#ffffff'} p={[0, 0.38, 0]} s={[0.6, 0.55, 0.6]} />
          <P g={geo.cylinder} c={dress.color} p={[0, 0.98, 0]} s={[0.17, 0.3, 0.15]} />
          <P g={geo.sphere} c={dress.color2 ?? '#ffffff'} p={[0, 1.05, 0.12]} s={0.05} />
          {[-1, 1].map((d) => (
            <P key={d} g={geo.sphere} c={dress.color2 ?? '#ffffff'} p={[d * 0.2, 1.08, 0]} s={0.09} />
          ))}
        </>
      ) : (
        <>
          {top?.shape === 'onepiece' ? (
            <>
              <P g={geo.cone} c={top.color} p={[0, 0.72, 0]} s={[0.34, 0.6, 0.32]} />
              <P g={geo.cylinder} c={top.color} p={[0, 0.98, 0]} s={[0.17, 0.3, 0.15]} />
              <P g={geo.torus} c={top.color2 ?? '#ffffff'} p={[0, 0.44, 0]} s={[0.33, 0.33, 0.5]} r={[Math.PI / 2, 0, 0]} />
            </>
          ) : (
            <>
              <P g={geo.cylinder} c={top?.color ?? '#ffb3d1'} p={[0, 0.93, 0]} s={[0.19, 0.36, 0.16]} />
              {top?.shape === 'blouse' && <P g={geo.sphere} c={top.color2 ?? '#ffffff'} p={[0, 1.07, 0.12]} s={[0.1, 0.05, 0.04]} />}
              {bottom?.shape === 'shorts' ? (
                [-1, 1].map((d) => <P key={d} g={geo.cylinder} c={bottom.color} p={[d * 0.09, 0.66, 0]} s={[0.1, 0.16, 0.1]} />)
              ) : (
                <>
                  <P g={geo.cone} c={bottom?.color ?? '#9fd8ff'} p={[0, 0.66, 0]} s={[0.3, 0.32, 0.28]} />
                  {bottom?.color2 && <P g={geo.torus} c={bottom.color2} p={[0, 0.52, 0]} s={[0.29, 0.29, 0.4]} r={[Math.PI / 2, 0, 0]} />}
                </>
              )}
            </>
          )}
        </>
      )}
      {/* うで */}
      {[-1, 1].map((d) => (
        <group key={`a${d}`} position={[d * 0.22, 1.05, 0]} rotation={[0, 0, d * 0.35]}>
          <P g={geo.cylinder} c={skin} p={[0, -0.17, 0]} s={[0.045, 0.32, 0.045]} />
          <P g={geo.sphere} c={dress?.color ?? top?.color ?? '#ffb3d1'} p={[0, -0.02, 0]} s={0.075} />
        </group>
      ))}
      {hat?.shape === 'brim' && (
        <group position={[0, 1.6, 0]}>
          <P g={geo.cylinder} c={hat.color} p={[0, 0, 0]} s={[0.46, 0.03, 0.46]} />
          <P g={geo.sphere} c={hat.color} p={[0, 0.06, 0]} s={[0.28, 0.16, 0.28]} />
          <P g={geo.torus} c={hat.color2 ?? '#ff8fbf'} p={[0, 0.05, 0]} s={[0.27, 0.27, 0.3]} r={[Math.PI / 2, 0, 0]} />
        </group>
      )}
      {hat?.shape === 'beret' && <P g={geo.sphere} c={hat.color} p={[0.06, 1.66, -0.02]} s={[0.32, 0.1, 0.3]} r={[0, 0, -0.2]} />}
      {hat?.shape === 'wreath' && (
        <group position={[0, 1.6, 0]}>
          {Array.from({ length: 8 }, (_, i) => (
            <P key={i} g={geo.sphere} c={i % 2 ? hat.color : (hat.color2 ?? '#fff')} p={[Math.cos((i / 8) * Math.PI * 2) * 0.28, 0, Math.sin((i / 8) * Math.PI * 2) * 0.28]} s={0.06} />
          ))}
        </group>
      )}
      {tiara && (
        <group position={[0, 1.66, 0.08]}>
          <P g={geo.torus} c={tiara.color} p={[0, 0, 0]} s={[0.2, 0.2, 0.2]} r={[Math.PI / 2.3, 0, 0]} e="#5a4a00" />
          {[-1, 0, 1].map((d) => (
            <P key={d} g={geo.cone} c={tiara.color} p={[d * 0.1, 0.06, 0.12 - Math.abs(d) * 0.03]} s={[0.03, d === 0 ? 0.13 : 0.08, 0.03]} e="#5a4a00" />
          ))}
          <P g={geo.octa} c={tiara.color2 ?? '#ff8fbf'} p={[0, 0.04, 0.17]} s={0.04} e="#401030" />
        </group>
      )}
      {acc?.shape === 'necklace' && <P g={geo.star} c={acc.color} p={[0, 1.04, 0.17]} s={0.05} e="#6a5a00" />}
      {acc?.shape === 'bag' && <P g={geo.heart} c={acc.color} p={[0.27, 0.72, 0.05]} s={0.09} />}
      {acc?.shape === 'wand' && (
        <group position={[0.36, 0.72, 0.1]} rotation={[0.3, 0, -0.3]}>
          <P g={geo.cylinder} c="#ffffff" p={[0, 0, 0]} s={[0.015, 0.32, 0.015]} />
          <P g={geo.star} c={acc.color} p={[0, 0.2, 0]} s={0.06} e="#6a5a00" />
        </group>
      )}
    </>
  );
}

export function HeroineModel({ look, equipped }: { look: PlayerLook; equipped: Record<OutfitSlot, string | null> }) {
  return (
    <group>
      <Clothes equipped={equipped} skin={look.skinColor} />
      {/* あたま */}
      <P g={geo.sphere} c={look.skinColor} p={[0, 1.36, 0]} s={[0.29, 0.28, 0.27]} />
      {[-1, 1].map((d) => (
        <group key={d}>
          <P g={geo.sphere} c={look.eyeColor} p={[d * 0.1, 1.34, 0.24]} s={[0.045, 0.06, 0.03]} />
          <P g={geo.sphere} c="#ffffff" p={[d * 0.1 + 0.012, 1.36, 0.262]} s={0.015} />
          <P g={geo.sphere} c="#ffaacb" p={[d * 0.17, 1.27, 0.21]} s={[0.045, 0.025, 0.02]} />
        </group>
      ))}
      <P g={geo.sphere} c="#e0708a" p={[0, 1.24, 0.26]} s={[0.03, 0.012, 0.01]} />
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
      g.position.y = Math.abs(Math.sin(t * 10)) * 0.06;
      g.rotation.z = Math.sin(t * 10) * 0.04;
    } else if (a === 'pose') {
      g.rotation.y = Math.sin(t * 2) * 0.5;
      g.position.y = Math.abs(Math.sin(t * 3)) * 0.1;
    } else {
      g.position.y = Math.sin(t * 2) * 0.01;
    }
  });
  return (
    <group {...props}>
      <mesh geometry={geo.circle} material={shadowMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} scale={princess ? 0.6 : 0.35} />
      <group ref={inner}>
        <HeroineModel look={look} equipped={equipped} />
      </group>
      {princess && <Sparkles count={24} radius={0.8} height={1.8} color="#fff3a0" />}
    </group>
  );
}
