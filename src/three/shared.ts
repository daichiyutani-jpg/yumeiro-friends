// 3Dで共有するジオメトリ・マテリアル。同じ物を使い回して、スマートフォンのメモリと描画負荷を抑える。
import * as THREE from 'three';

const matCache = new Map<string, THREE.Material>();

/** 色ごとに1つだけ作るマテリアル（Lambert は軽くて やわらかい見た目になる） */
export function mat(color: string, opts?: { emissive?: string; transparent?: number }): THREE.Material {
  const key = `${color}|${opts?.emissive ?? ''}|${opts?.transparent ?? ''}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({
      color,
      ...(opts?.emissive ? { emissive: new THREE.Color(opts.emissive) } : {}),
      transparent: opts?.transparent !== undefined,
      opacity: opts?.transparent ?? 1,
      depthWrite: opts?.transparent === undefined,
    });
    matCache.set(key, m);
  }
  return m;
}

export const geo = {
  sphere: new THREE.SphereGeometry(1, 18, 14),
  sphereLow: new THREE.SphereGeometry(1, 10, 8),
  cone: new THREE.ConeGeometry(1, 1, 14),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 14),
  box: new THREE.BoxGeometry(1, 1, 1),
  torus: new THREE.TorusGeometry(1, 0.18, 8, 24),
  octa: new THREE.OctahedronGeometry(1),
  dodeca: new THREE.DodecahedronGeometry(1),
  circle: new THREE.CircleGeometry(1, 24),
  plane: new THREE.PlaneGeometry(1, 1),
  star: makeStarGeometry(),
  heart: makeHeartGeometry(),
};

function makeStarGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 1 : 0.45;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 1 });
  g.center();
  return g;
}

function makeHeartGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, -0.9);
  s.bezierCurveTo(-1.2, 0, -0.9, 1, 0, 0.45);
  s.bezierCurveTo(0.9, 1, 1.2, 0, 0, -0.9);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 1 });
  g.center();
  return g;
}

/** 影のかわりの まるい うすい円（シャドウマップより ずっと軽い） */
export const shadowMat = new THREE.MeshBasicMaterial({ color: '#7a5a8a', transparent: true, opacity: 0.18, depthWrite: false });

const emojiCache = new Map<string, THREE.SpriteMaterial>();
/** 絵文字を Canvas に描いて スプライト用のマテリアルにする（画像ファイル不要） */
export function emojiMaterial(emoji: string, bg?: string): THREE.SpriteMaterial {
  const key = `${emoji}|${bg ?? ''}`;
  let m = emojiCache.get(key);
  if (m) return m;
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const c = canvas.getContext('2d')!;
  if (bg) {
    c.fillStyle = bg;
    c.beginPath();
    c.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#ffffff';
    c.lineWidth = 6;
    c.stroke();
  }
  c.font = `${bg ? 54 : 72}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(emoji, size / 2, size / 2 + 4);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  m = new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true });
  emojiCache.set(key, m);
  return m;
}

/** 決まった種から 同じ並びの乱数を出す（森の木の配置を毎回同じにする） */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
