import type * as THREE from 'three';
import type { FurnitureDef } from '../game/types';
import { cgeo, geo, mat, shadowMat } from './shared';

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
          <P g={geo.cylinder} c="#ffffff" p={[0, 0.2, 0]} s={[0.32, 0.4, 0.32]} />
          <P g={geo.cylinder} c="#ffb3d1" p={[0, 0.36, 0]} s={[0.34, 0.06, 0.34]} />
          <P g={geo.cylinder} c={c2} p={[0, 0.75, 0]} s={[0.07, 0.8, 0.07]} />
          <P g={geo.sphere} c={c} p={[0, 1.3, 0]} s={0.48} />
          <P g={geo.sphere} c="#ffd6e7" p={[0.28, 1.42, 0.18]} s={0.28} />
        </>
      );
      break;
    case 'screen':
      body = (
        <>
          {[-0.36, 0, 0.36].map((x, i) => (
            <group key={x} position={[x, 0, 0]} rotation={[0, i === 1 ? 0 : x > 0 ? -0.35 : 0.35, 0]}>
              <P g={geo.box} c={c} p={[0, 0.6, 0]} s={[0.36, 1.1, 0.05]} />
              <P g={geo.heart} c={c2} p={[0, 0.85, 0.03]} s={0.12} />
            </group>
          ))}
        </>
      );
      break;
    case 'shelf':
      body = (
        <>
          <P g={geo.box} c={c} p={[0, 0.7, 0]} s={[1, 1.4, 0.4]} />
          {[0.35, 0.8].map((y) => (
            <group key={y}>
              <P g={geo.box} c="#fff6e6" p={[0, y + 0.18, 0.05]} s={[0.88, 0.38, 0.32]} />
              {[-0.3, -0.18, -0.06, 0.12, 0.26].map((x, i) => (
                <P key={x} g={geo.box} c={['#ff9ec7', '#8fd3ff', '#ffe066', '#a8ead2', '#cdb8ff'][i]} p={[x, y + 0.14, 0.08]} s={[0.09, 0.28 - (i % 2) * 0.05, 0.24]} />
              ))}
            </group>
          ))}
          <P g={geo.heart} c={c2} p={[0, 1.5, 0]} s={0.16} />
        </>
      );
      break;
    case 'dresser':
      body = (
        <>
          <P g={geo.box} c={c} p={[0, 0.38, 0]} s={[0.9, 0.76, 0.45]} />
          {[0.22, 0.52].map((y) => (
            <P key={y} g={geo.sphere} c="#ffd84d" p={[0, y, 0.24]} s={0.035} />
          ))}
          <P g={geo.torus} c="#ffffff" p={[0, 1.15, -0.12]} s={[0.36, 0.42, 0.4]} />
          <P g={geo.circle} c={c2} p={[0, 1.15, -0.13]} s={[0.34, 0.4, 1]} e="#405060" />
          <P g={geo.sphere} c="#ff9ec7" p={[0.3, 0.82, 0.05]} s={[0.06, 0.08, 0.06]} />
        </>
      );
      break;
    case 'piano':
      body = (
        <>
          <P g={geo.box} c={c} p={[0, 0.55, -0.1]} s={[1.1, 1.1, 0.45]} />
          <P g={geo.box} c={c} p={[0, 0.62, 0.2]} s={[1.1, 0.08, 0.25]} />
          <P g={geo.box} c="#ffffff" p={[0, 0.67, 0.22]} s={[1, 0.03, 0.18]} />
          {Array.from({ length: 7 }, (_, i) => (
            <P key={i} g={geo.box} c="#4a3a5a" p={[-0.39 + i * 0.13, 0.69, 0.18]} s={[0.05, 0.03, 0.1]} />
          ))}
          <P g={geo.heart} c={c2} p={[0, 0.95, 0.13]} s={0.13} />
          <P g={geo.box} c={c2} p={[0, 0.25, 0.45]} s={[0.5, 0.06, 0.28]} />
        </>
      );
      break;
    case 'toybox':
      body = (
        <>
          <P g={geo.box} c={c} p={[0, 0.25, 0]} s={[0.8, 0.5, 0.5]} />
          <P g={geo.box} c={c2} p={[0, 0.53, -0.05]} s={[0.84, 0.08, 0.56]} r={[-0.25, 0, 0]} />
          <P g={geo.star} c="#ffffff" p={[0, 0.27, 0.26]} s={0.14} />
          <P g={geo.sphere} c="#8fd3ff" p={[-0.2, 0.58, 0.08]} s={0.1} />
        </>
      );
      break;
    case 'plush':
      body = (
        <>
          <P g={geo.sphere} c={c} p={[0, 0.25, 0]} s={[0.26, 0.24, 0.22]} />
          <P g={geo.sphere} c={c} p={[0, 0.58, 0.02]} s={0.2} />
          {[-0.13, 0.13].map((x) => (
            <P key={x} g={geo.sphere} c={c} p={[x, 0.76, 0]} s={0.08} />
          ))}
          <P g={geo.sphere} c="#fff6e6" p={[0, 0.54, 0.17]} s={[0.09, 0.07, 0.05]} />
          {[-0.07, 0.07].map((x) => (
            <P key={`e${x}`} g={geo.sphere} c="#4a3a5a" p={[x, 0.62, 0.18]} s={0.025} />
          ))}
          <P g={geo.heart} c={c2} p={[0, 0.3, 0.22]} s={0.1} />
        </>
      );
      break;
    case 'rug_round':
      body = (
        <>
          <P g={geo.cylinder} c={c} p={[0, 0.015, 0]} s={[1.1, 0.03, 1.1]} />
          <P g={geo.cylinder} c={c2} p={[0, 0.02, 0]} s={[0.8, 0.03, 0.8]} />
          <P g={geo.cylinder} c={c} p={[0, 0.025, 0]} s={[0.5, 0.03, 0.5]} />
        </>
      );
      break;
    case 'rug_heart':
      body = (
        <>
          <P g={geo.heart} c={c} p={[0, 0.02, 0]} s={[1.4, 1.4, 0.05]} r={[-Math.PI / 2, 0, 0]} />
          <P g={geo.heart} c={c2} p={[0, 0.035, 0.05]} s={[0.9, 0.9, 0.05]} r={[-Math.PI / 2, 0, 0]} />
        </>
      );
      break;
    // ---- かべの かざり（かべの まえで +z を むく）----
    case 'window':
      body = (
        <>
          <P g={geo.box} c={c} p={[0, 2.4, 0.04]} s={[1.5, 1.2, 0.08]} />
          <P g={geo.box} c={c2} p={[0, 2.4, 0.07]} s={[1.3, 1, 0.03]} e="#3a5a70" />
          <P g={geo.sphere} c="#ffffff" p={[-0.3, 2.55, 0.1]} s={[0.22, 0.1, 0.02]} />
          <P g={geo.sphere} c="#ffffff" p={[0.25, 2.3, 0.1]} s={[0.18, 0.08, 0.02]} />
          <P g={geo.box} c={c} p={[0, 2.4, 0.1]} s={[0.06, 1, 0.03]} />
          <P g={geo.box} c={c} p={[0, 2.4, 0.1]} s={[1.3, 0.06, 0.03]} />
          {[-0.85, 0.85].map((x) => (
            <P key={x} g={geo.box} c="#ffc6dc" p={[x, 2.35, 0.12]} s={[0.25, 1.4, 0.05]} />
          ))}
          <P g={geo.box} c={c} p={[0, 1.75, 0.12]} s={[1.6, 0.08, 0.22]} />
        </>
      );
      break;
    case 'frame':
      body = (
        <>
          <P g={geo.box} c={c} p={[0, 2.3, 0.04]} s={[0.9, 0.7, 0.06]} />
          <P g={geo.box} c="#fffaf0" p={[0, 2.3, 0.07]} s={[0.76, 0.56, 0.02]} />
          {[-0.2, 0, 0.2].map((x, i) => (
            <group key={x}>
              <P g={geo.box} c="#7ed69a" p={[x, 2.2, 0.085]} s={[0.02, 0.22, 0.01]} />
              <P g={geo.sphere} c={['#ffb3d1', '#ffe066', '#cdb8ff'][i]} p={[x, 2.34, 0.09]} s={[0.07, 0.07, 0.02]} />
            </group>
          ))}
        </>
      );
      break;
    case 'clock':
      body = (
        <>
          <P g={geo.heart} c={c} p={[0, 2.5, 0.05]} s={[0.55, 0.55, 0.3]} />
          <P g={geo.circle} c={c2} p={[0, 2.45, 0.11]} s={0.2} />
          <P g={geo.box} c="#4a3a5a" p={[0, 2.5, 0.12]} s={[0.02, 0.12, 0.01]} />
          <P g={geo.box} c="#4a3a5a" p={[0.04, 2.45, 0.12]} s={[0.09, 0.02, 0.01]} />
        </>
      );
      break;
    case 'wallshelf':
      body = (
        <>
          <P g={geo.box} c={c} p={[0, 2, 0.15]} s={[1.2, 0.07, 0.3]} />
          {[-0.4, 0.4].map((x) => (
            <P key={x} g={geo.box} c={c} p={[x, 1.9, 0.05]} s={[0.05, 0.2, 0.1]} />
          ))}
          <P g={geo.cylinder} c="#ffffff" p={[-0.35, 2.13, 0.15]} s={[0.08, 0.18, 0.08]} />
          <P g={geo.sphere} c={c2} p={[-0.35, 2.28, 0.15]} s={0.1} />
          <P g={geo.box} c="#ff9ec7" p={[0.1, 2.15, 0.15]} s={[0.25, 0.2, 0.16]} />
          <P g={geo.star} c="#ffe066" p={[0.4, 2.15, 0.15]} s={0.1} />
        </>
      );
      break;
    case 'garland':
      body = (
        <>
          {Array.from({ length: 7 }, (_, i) => {
            const x = -0.9 + i * 0.3;
            const y = 3.3 - Math.sin((i / 6) * Math.PI) * 0.25;
            return <P key={i} g={geo.star} c={i % 2 ? c2 : c} p={[x, y - 0.12, 0.06]} s={0.11} e={i % 2 ? undefined : '#806010'} />;
          })}
          <P g={cgeo.arc} c="#ffffff" p={[0, 3.35, 0.04]} s={[0.95, 0.3, 0.05]} r={[0, 0, Math.PI]} />
        </>
      );
      break;
    case 'mirror':
      body = (
        <>
          <P g={geo.sphere} c={c} p={[0, 2.3, 0.03]} s={[0.42, 0.55, 0.05]} />
          <P g={geo.circle} c={c2} p={[0, 2.3, 0.09]} s={[0.32, 0.44, 1]} e="#405060" />
          {[0, 1, 2, 3, 4].map((i) => (
            <P key={i} g={geo.cone} c="#fff6e6" p={[-0.24 + i * 0.12, 2.86 - Math.abs(i - 2) * 0.04, 0.06]} s={[0.07, 0.14, 0.03]} />
          ))}
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
  // かべの かざりと ラグには ゆかの まるい かげを つけない
  const flat = def.kind === 'wall' || def.kind === 'rug';
  return (
    <group>
      {!flat && <mesh geometry={geo.circle} material={shadowMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} scale={0.55} />}
      {body}
    </group>
  );
}
