import { useFrame, type ThreeElements } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type * as THREE from 'three';
import type { CreatureLook } from '../game/types';
import { geo, mat, shadowMat } from './shared';

export type CreatureAnim = 'idle' | 'walk' | 'happy' | 'sleep' | 'pose' | 'love';

type V3 = [number, number, number];

function Part({ g, color, p, s, r, emissive, opacity }: { g: THREE.BufferGeometry; color: string; p: V3; s: number | V3; r?: V3; emissive?: string; opacity?: number }) {
  const scale: V3 = typeof s === 'number' ? [s, s, s] : s;
  return <mesh geometry={g} material={mat(color, { emissive, transparent: opacity })} position={p} scale={scale} rotation={r} />;
}

function Ears({ look }: { look: CreatureLook }) {
  const { body, accent, belly } = look;
  switch (look.ears) {
    case 'long':
      return (
        <>
          {[-1, 1].map((d) => (
            <group key={d} position={[d * 0.15, 1.18, -0.02]} rotation={[0, 0, -d * 0.18]}>
              <Part g={geo.sphere} color={body} p={[0, 0.2, 0]} s={[0.1, 0.28, 0.08]} />
              <Part g={geo.sphere} color={accent} p={[0, 0.2, 0.04]} s={[0.055, 0.2, 0.05]} />
            </group>
          ))}
        </>
      );
    case 'pointy':
      return (
        <>
          {[-1, 1].map((d) => (
            <group key={d} position={[d * 0.21, 1.16, 0]} rotation={[0, 0, -d * 0.35]}>
              <Part g={geo.cone} color={body} p={[0, 0.1, 0]} s={[0.12, 0.26, 0.1]} />
              <Part g={geo.cone} color={accent} p={[0, 0.08, 0.04]} s={[0.07, 0.17, 0.05]} />
            </group>
          ))}
        </>
      );
    case 'round':
      return (
        <>
          {[-1, 1].map((d) => (
            <group key={d}>
              <Part g={geo.sphere} color={body} p={[d * 0.27, 1.16, -0.02]} s={[0.12, 0.12, 0.07]} />
              <Part g={geo.sphere} color={belly} p={[d * 0.27, 1.16, 0.03]} s={[0.07, 0.07, 0.04]} />
            </group>
          ))}
        </>
      );
    case 'tiny':
      return (
        <>
          {[-1, 1].map((d) => (
            <Part key={d} g={geo.sphere} color={body} p={[d * 0.26, 1.1, 0.02]} s={[0.08, 0.07, 0.05]} />
          ))}
        </>
      );
    case 'tuft':
      return (
        <>
          {[-1, 1].map((d) => (
            <Part key={d} g={geo.cone} color={body} p={[d * 0.22, 1.2, 0]} s={[0.08, 0.2, 0.06]} r={[0, 0, -d * 0.5]} />
          ))}
        </>
      );
    case 'antler':
      return (
        <>
          {[-1, 1].map((d) => (
            <group key={d} position={[d * 0.16, 1.2, -0.04]} rotation={[0, 0, -d * 0.3]}>
              <Part g={geo.cylinder} color="#c99b74" p={[0, 0.14, 0]} s={[0.025, 0.28, 0.025]} />
              <Part g={geo.cylinder} color="#c99b74" p={[d * 0.06, 0.2, 0]} s={[0.02, 0.14, 0.02]} r={[0, 0, -d * 0.8]} />
              <Part g={geo.sphere} color={accent} p={[0, 0.3, 0]} s={0.05} />
              <Part g={geo.sphere} color="#fff6a8" p={[0, 0.3, 0.03]} s={0.022} />
            </group>
          ))}
          {[-1, 1].map((d) => (
            <Part key={`e${d}`} g={geo.sphere} color={body} p={[d * 0.3, 1.05, 0]} s={[0.1, 0.05, 0.05]} />
          ))}
        </>
      );
    default:
      return null;
  }
}

function Tail({ look }: { look: CreatureLook }) {
  const { body, accent, belly } = look;
  switch (look.tail) {
    case 'puff':
      return <Part g={geo.sphere} color={belly} p={[0, 0.3, -0.33]} s={0.11} />;
    case 'fluffy':
      return (
        <group position={[0, 0.38, -0.36]} rotation={[-0.7, 0, 0]}>
          <Part g={geo.sphere} color={body} p={[0, 0.12, 0]} s={[0.14, 0.26, 0.14]} />
          <Part g={geo.sphere} color={accent} p={[0, 0.34, 0]} s={0.09} />
        </group>
      );
    case 'thin':
      return <Part g={geo.cylinder} color={body} p={[0, 0.36, -0.36]} s={[0.035, 0.3, 0.035]} r={[-0.8, 0, 0]} />;
    case 'spiky':
      return (
        <>
          {[[-0.18, 0.95, -0.22], [0.18, 0.95, -0.22], [0, 1.08, -0.2], [-0.24, 0.72, -0.26], [0.24, 0.72, -0.26], [0, 0.82, -0.32], [-0.12, 0.5, -0.3], [0.12, 0.5, -0.3]].map((p, i) => (
            <Part key={i} g={geo.cone} color={['#ff9ec7', '#ffd84d', '#8fd3ff', '#b9a8ff', '#a8ead2'][i % 5]} p={p as V3} s={[0.07, 0.2, 0.07]} r={[-1.9, 0, (p[0] as number) * 2]} />
          ))}
        </>
      );
    default:
      return null;
  }
}

function Motif({ look }: { look: CreatureLook }) {
  const a = look.accent;
  const pos: V3 = [0.2, 1.2, 0.12];
  switch (look.motif) {
    case 'flower':
      return (
        <group position={pos}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Part key={i} g={geo.sphere} color={a} p={[Math.cos((i / 5) * Math.PI * 2) * 0.05, Math.sin((i / 5) * Math.PI * 2) * 0.05, 0]} s={0.04} />
          ))}
          <Part g={geo.sphere} color="#fff3a0" p={[0, 0, 0.02]} s={0.03} />
        </group>
      );
    case 'star':
      return <Part g={geo.star} color={a} p={pos} s={0.07} emissive="#7a5a00" />;
    case 'candy':
      return <Part g={geo.torus} color={a} p={pos} s={0.05} />;
    case 'bubble':
      return (
        <>
          <Part g={geo.sphere} color="#d9f4ff" p={[0.3, 1.25, 0.1]} s={0.06} opacity={0.6} />
          <Part g={geo.sphere} color="#d9f4ff" p={[0.4, 1.4, 0]} s={0.04} opacity={0.6} />
        </>
      );
    case 'cloud':
      return (
        <group position={[0, 1.23, 0]}>
          <Part g={geo.sphere} color="#ffffff" p={[0, 0, 0]} s={0.09} />
          <Part g={geo.sphere} color="#ffffff" p={[0.08, -0.02, 0]} s={0.07} />
          <Part g={geo.sphere} color="#ffffff" p={[-0.08, -0.02, 0]} s={0.07} />
        </group>
      );
    case 'gem':
      return <Part g={geo.octa} color={a} p={[0, 1.22, 0.1]} s={[0.06, 0.08, 0.06]} emissive="#204040" />;
    case 'leaf':
      return <Part g={geo.sphere} color="#8ed68e" p={pos} s={[0.06, 0.03, 0.1]} />;
    case 'moon':
      return <Part g={geo.torus} color={a} p={[0, 0.98, 0.36]} s={[0.05, 0.05, 0.03]} emissive="#6a5a10" />;
    case 'ribbon':
      return (
        <group position={[0.18, 1.18, 0.05]}>
          <Part g={geo.cone} color={a} p={[-0.06, 0, 0]} s={[0.05, 0.1, 0.05]} r={[0, 0, Math.PI / 2]} />
          <Part g={geo.cone} color={a} p={[0.06, 0, 0]} s={[0.05, 0.1, 0.05]} r={[0, 0, -Math.PI / 2]} />
          <Part g={geo.sphere} color={a} p={[0, 0, 0]} s={0.03} />
        </group>
      );
    case 'rainbow':
      return (
        <group position={[0, 1.15, -0.05]} rotation={[0, 0, 0]}>
          {['#ff9ec7', '#ffd84d', '#8fd3ff'].map((c, i) => (
            <Part key={c} g={geo.torus} color={c} p={[0, 0, -i * 0.01]} s={[0.22 - i * 0.04, 0.22 - i * 0.04, 0.05]} />
          ))}
        </group>
      );
    case 'snow':
      return <Part g={geo.octa} color="#ffffff" p={[0, 1.24, 0]} s={[0.08, 0.04, 0.08]} emissive="#304060" />;
    case 'magic':
      return (
        <group position={[0.34, 0.5, 0.12]} rotation={[0, 0, -0.4]}>
          <Part g={geo.cylinder} color="#c99b74" p={[0, 0, 0]} s={[0.015, 0.3, 0.015]} />
          <Part g={geo.star} color="#ffe066" p={[0, 0.18, 0]} s={0.05} emissive="#7a5a00" />
        </group>
      );
    default:
      return null;
  }
}

function Extra({ look }: { look: CreatureLook }) {
  const a = look.accent;
  switch (look.extra) {
    case 'crown':
      return (
        <group position={[0, 1.2, 0]}>
          <Part g={geo.cylinder} color="#ffd84d" p={[0, 0, 0]} s={[0.13, 0.06, 0.13]} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Part key={i} g={geo.cone} color="#ffd84d" p={[Math.cos((i / 5) * Math.PI * 2) * 0.11, 0.07, Math.sin((i / 5) * Math.PI * 2) * 0.11]} s={[0.03, 0.08, 0.03]} />
          ))}
          <Part g={geo.sphere} color={a} p={[0, 0.02, 0.13]} s={0.03} />
        </group>
      );
    case 'wings':
      return (
        <>
          {[-1, 1].map((d) => (
            <Part key={d} g={geo.sphere} color="#ffffff" p={[d * 0.32, 0.55, -0.2]} s={[0.22, 0.12, 0.04]} r={[0, d * 0.5, d * 0.5]} opacity={0.85} />
          ))}
        </>
      );
    case 'halo':
      return <Part g={geo.torus} color="#fff3a0" p={[0, 1.38, 0]} s={[0.18, 0.18, 0.18]} r={[Math.PI / 2, 0, 0]} emissive="#8a7a20" />;
    case 'cape':
      return <Part g={geo.cone} color={a} p={[0, 0.45, -0.15]} s={[0.36, 0.55, 0.2]} />;
    default:
      return null;
  }
}

export function CreatureModel({ look }: { look: CreatureLook }) {
  const { body, belly } = look;
  return (
    <group scale={look.scale ?? 1}>
      {/* からだ */}
      <Part g={geo.sphere} color={body} p={[0, 0.36, 0]} s={[0.34, 0.33, 0.3]} />
      <Part g={geo.sphere} color={belly} p={[0, 0.34, 0.14]} s={[0.22, 0.22, 0.18]} />
      {/* あし */}
      {[-1, 1].map((d) => (
        <Part key={d} g={geo.sphere} color={body} p={[d * 0.15, 0.07, 0.08]} s={[0.09, 0.07, 0.11]} />
      ))}
      {/* うで */}
      {[-1, 1].map((d) => (
        <Part key={`a${d}`} g={geo.sphere} color={body} p={[d * 0.3, 0.38, 0.08]} s={[0.07, 0.1, 0.07]} />
      ))}
      {/* あたま */}
      <Part g={geo.sphere} color={body} p={[0, 0.88, 0]} s={[0.38, 0.34, 0.34]} />
      <Part g={geo.sphere} color={belly} p={[0, 0.8, 0.2]} s={[0.2, 0.14, 0.14]} />
      {/* め */}
      {[-1, 1].map((d) => (
        <group key={`e${d}`}>
          <Part g={geo.sphere} color="#3a2a4a" p={[d * 0.13, 0.9, 0.3]} s={[0.05, 0.065, 0.03]} />
          <Part g={geo.sphere} color="#ffffff" p={[d * 0.13 + 0.015, 0.92, 0.325]} s={0.017} />
        </group>
      ))}
      {/* はな・ほっぺ */}
      <Part g={geo.sphere} color="#7a4a5a" p={[0, 0.83, 0.335]} s={[0.025, 0.018, 0.015]} />
      {[-1, 1].map((d) => (
        <Part key={`c${d}`} g={geo.sphere} color="#ffa5c4" p={[d * 0.22, 0.81, 0.27]} s={[0.055, 0.035, 0.02]} />
      ))}
      <Ears look={look} />
      <Tail look={look} />
      <Motif look={look} />
      <Extra look={look} />
    </group>
  );
}

type GroupProps = ThreeElements['group'];

/** アニメーション付きの なかま */
export function Creature({ look, anim = 'idle', animRef, shadow = true, ...props }: { look: CreatureLook; anim?: CreatureAnim; animRef?: { current: CreatureAnim }; shadow?: boolean } & GroupProps) {
  const inner = useRef<THREE.Group>(null);
  const phase = useMemo(() => Math.random() * 10, []);
  useFrame(({ clock }) => {
    const g = inner.current;
    if (!g) return;
    const t = clock.elapsedTime + phase;
    g.rotation.set(0, 0, 0);
    g.position.set(0, 0, 0);
    g.scale.set(1, 1, 1);
    switch (animRef?.current ?? anim) {
      case 'idle':
        g.scale.y = 1 + Math.sin(t * 2.2) * 0.03;
        g.rotation.z = Math.sin(t * 1.1) * 0.04;
        break;
      case 'walk':
        g.position.y = Math.abs(Math.sin(t * 9)) * 0.12;
        g.rotation.z = Math.sin(t * 9) * 0.08;
        break;
      case 'happy':
        g.position.y = Math.abs(Math.sin(t * 6)) * 0.35;
        g.rotation.y = Math.sin(t * 3) * 0.3;
        break;
      case 'love':
        g.position.y = Math.abs(Math.sin(t * 4)) * 0.15;
        g.scale.setScalar(1 + Math.sin(t * 8) * 0.04);
        break;
      case 'pose':
        g.rotation.y = t * 2.5;
        g.position.y = 0.15 + Math.sin(t * 5) * 0.05;
        break;
      case 'sleep':
        g.rotation.z = Math.PI / 2.4;
        g.position.set(0.25, -0.1, 0);
        g.scale.y = 1 + Math.sin(t * 1.5) * 0.04;
        break;
    }
  });
  return (
    <group {...props}>
      {shadow && <mesh geometry={geo.circle} material={shadowMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} scale={0.38 * (look.scale ?? 1)} />}
      <group ref={inner}>
        <CreatureModel look={look} />
      </group>
    </group>
  );
}
