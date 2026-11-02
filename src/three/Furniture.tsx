import type * as THREE from 'three';
import type { FurnitureDef } from '../game/types';
import { geo, mat, shadowMat } from './shared';

type V3 = [number, number, number];
function P({ g, c, p, s, r, e, o }: { g: THREE.BufferGeometry; c: string; p: V3; s: number | V3; r?: V3; e?: string; o?: number }) {
  return <mesh geometry={g} material={mat(c, { emissive: e, transparent: o })} position={p} scale={typeof s === 'number' ? [s, s, s] : s} rotation={r} />;
}

export function FurnitureModel({ def }: { def: FurnitureDef }) {
  const c = def.color;
  const c2 = def.color2 ?? '#ffffff';
  let body: React.ReactNode = null;
  switch (def.model) {
    case 'table':
      body = (
        <>
          <P g={geo.cylinder} c={c} p={[0, 0.6, 0]} s={[0.6, 0.08, 0.6]} />
          <P g={geo.cylinder} c={c2} p={[0, 0.3, 0]} s={[0.07, 0.6, 0.07]} />
          <P g={geo.cylinder} c={c2} p={[0, 0.03, 0]} s={[0.3, 0.05, 0.3]} />
        </>
      );
      break;
    case 'chair':
      body = (
        <>
          <P g={geo.cylinder} c={c} p={[0, 0.35, 0]} s={[0.3, 0.08, 0.3]} />
          {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
            <P key={i} g={geo.cylinder} c="#ffffff" p={[x, 0.16, z]} s={[0.03, 0.32, 0.03]} />
          ))}
          <P g={geo.heart} c={c} p={[0, 0.72, -0.24]} s={0.32} />
        </>
      );
      break;
    case 'bed':
      body = (
        <>
          <P g={geo.box} c="#fff1c9" p={[0, 0.2, 0]} s={[1, 0.3, 1.5]} />
          <P g={geo.box} c={c} p={[0, 0.4, 0.15]} s={[0.98, 0.12, 1.15]} />
          <P g={geo.sphere} c={c2} p={[0, 0.45, -0.5]} s={[0.35, 0.1, 0.18]} />
          <P g={geo.box} c="#fff1c9" p={[0, 0.45, -0.75]} s={[1, 0.7, 0.08]} />
        </>
      );
      break;
    case 'sofa':
      body = (
        <>
          {[-0.4, 0, 0.4].map((x) => (
            <P key={x} g={geo.sphere} c={c} p={[x, 0.28, 0]} s={[0.3, 0.2, 0.32]} />
          ))}
          {[-0.45, 0, 0.45].map((x) => (
            <P key={`b${x}`} g={geo.sphere} c={c2} p={[x, 0.55, -0.25]} s={[0.3, 0.3, 0.18]} />
          ))}
        </>
      );
      break;
    case 'tree':
      body = (
        <>
          <P g={geo.cylinder} c={c2} p={[0, 0.5, 0]} s={[0.1, 1, 0.1]} />
          <P g={geo.sphere} c={c} p={[0, 1.2, 0]} s={0.55} />
          <P g={geo.sphere} c="#ffd6e7" p={[0.3, 1.35, 0.2]} s={0.32} />
        </>
      );
      break;
    case 'pot':
      body = (
        <>
          <P g={geo.cylinder} c={c2} p={[0, 0.18, 0]} s={[0.22, 0.36, 0.22]} />
          <P g={geo.sphere} c="#7ed69a" p={[0, 0.42, 0]} s={[0.2, 0.12, 0.2]} />
          {[0, 1, 2].map((i) => (
            <P key={i} g={geo.sphere} c={i === 1 ? '#fff3a0' : c} p={[Math.cos(i * 2.1) * 0.1, 0.55, Math.sin(i * 2.1) * 0.1]} s={0.08} />
          ))}
        </>
      );
      break;
    case 'fence':
      body = (
        <>
          {[-0.4, 0, 0.4].map((x) => (
            <P key={x} g={geo.box} c={c} p={[x, 0.3, 0]} s={[0.1, 0.6, 0.08]} />
          ))}
          <P g={geo.box} c={c} p={[0, 0.42, 0]} s={[1, 0.08, 0.06]} />
          <P g={geo.box} c={c} p={[0, 0.2, 0]} s={[1, 0.08, 0.06]} />
        </>
      );
      break;
    case 'lamp':
    case 'starlamp':
      body = (
        <>
          <P g={geo.cylinder} c="#ffffff" p={[0, 0.6, 0]} s={[0.04, 1.2, 0.04]} />
          {def.model === 'lamp' ? (
            <P g={geo.sphere} c={c} p={[0, 1.25, 0]} s={0.18} e="#c0a040" />
          ) : (
            <P g={geo.star} c={c} p={[0, 1.3, 0]} s={0.2} e="#a08020" />
          )}
          <P g={geo.cone} c={c2} p={[0, 1.42, 0]} s={[0.22, 0.14, 0.22]} />
        </>
      );
      break;
    case 'ball':
      body = (
        <>
          <P g={geo.sphere} c={c} p={[0, 0.22, 0]} s={0.22} />
          <P g={geo.torus} c={c2} p={[0, 0.22, 0]} s={[0.21, 0.21, 0.3]} />
        </>
      );
      break;
    case 'slide':
      body = (
        <>
          <P g={geo.box} c={c2} p={[-0.4, 0.5, 0]} s={[0.4, 1, 0.5]} />
          <P g={geo.box} c={c} p={[0.25, 0.5, 0]} s={[1.2, 0.06, 0.45]} r={[0, 0, -0.65]} />
        </>
      );
      break;
    case 'fountain':
      body = (
        <>
          <P g={geo.cylinder} c={c} p={[0, 0.15, 0]} s={[0.7, 0.3, 0.7]} />
          <P g={geo.cylinder} c={c2} p={[0, 0.31, 0]} s={[0.6, 0.02, 0.6]} o={0.7} />
          <P g={geo.cylinder} c={c} p={[0, 0.55, 0]} s={[0.08, 0.6, 0.08]} />
          {[0, 1, 2, 3].map((i) => (
            <P key={i} g={geo.sphere} c="#e6f8ff" p={[Math.cos(i * 1.6) * 0.3, 0.8 + i * 0.08, Math.sin(i * 1.6) * 0.3]} s={0.08} o={0.6} />
          ))}
        </>
      );
      break;
    case 'pumpkin':
      body = (
        <>
          <P g={geo.sphere} c={c} p={[0, 0.25, 0]} s={[0.35, 0.25, 0.35]} />
          <P g={geo.cylinder} c={c2} p={[0, 0.52, 0]} s={[0.04, 0.12, 0.04]} />
        </>
      );
      break;
    case 'snowman':
      body = (
        <>
          <P g={geo.sphere} c={c} p={[0, 0.3, 0]} s={0.3} />
          <P g={geo.sphere} c={c} p={[0, 0.72, 0]} s={0.2} />
          <P g={geo.cone} c="#ffa64d" p={[0, 0.72, 0.22]} s={[0.04, 0.12, 0.04]} r={[Math.PI / 2, 0, 0]} />
          <P g={geo.torus} c={c2} p={[0, 0.55, 0]} s={[0.2, 0.2, 0.3]} r={[Math.PI / 2, 0, 0]} />
        </>
      );
      break;
    default:
      body = <P g={geo.box} c={c} p={[0, 0.3, 0]} s={0.6} />;
  }
  return (
    <group>
      <mesh geometry={geo.circle} material={shadowMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} scale={0.55} />
      {body}
    </group>
  );
}
