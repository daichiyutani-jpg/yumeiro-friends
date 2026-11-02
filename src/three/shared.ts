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

// ---------- キャラクター用（主人公・なかま） ----------
// 背景より すこし 手間を かけて、なめらかな形と 質感の ちがい（はだ・毛・かみ・ぬの・ひとみ）を出す。

export type CharKind = 'skin' | 'fur' | 'hair' | 'cloth' | 'gloss' | 'satin';
const charCache = new Map<string, THREE.Material>();

/** キャラクター用マテリアル。毛と布は ふちが ふわっと明るく見える sheen で やわらかさを出す */
export function charMat(color: string, kind: CharKind = 'cloth', emissive?: string): THREE.Material {
  const key = `${color}|${kind}|${emissive ?? ''}`;
  let m = charCache.get(key);
  if (m) return m;
  const base = { color, ...(emissive ? { emissive: new THREE.Color(emissive) } : {}) };
  switch (kind) {
    case 'fur':
      m = new THREE.MeshPhysicalMaterial({ ...base, roughness: 0.92, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color('#ffffff') });
      break;
    case 'cloth':
      m = new THREE.MeshPhysicalMaterial({ ...base, roughness: 0.85, sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.6) });
      break;
    case 'satin':
      m = new THREE.MeshStandardMaterial({ ...base, roughness: 0.35, metalness: 0.05 });
      break;
    case 'hair':
      m = new THREE.MeshStandardMaterial({ ...base, roughness: 0.42 });
      break;
    case 'gloss':
      m = new THREE.MeshStandardMaterial({ ...base, roughness: 0.12 });
      break;
    default:
      m = new THREE.MeshStandardMaterial({ ...base, roughness: 0.62 });
  }
  charCache.set(key, m);
  return m;
}

/** 回転体（からだ・スカート・ドレス）。[半径, 高さ] の点を 下から順に（逆だと 面が うらがえる） */
function lathe(points: [number, number][], segments = 28): THREE.BufferGeometry {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);
}

export const cgeo = {
  sphere: new THREE.SphereGeometry(1, 32, 24),
  /** 上半分すこし多め（かみの毛の ベース） */
  cap: new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.56),
  /** 手足（長さ1・半径0.5 の カプセル。scale で ふとさ と ながさ を決める） */
  capsule: new THREE.CapsuleGeometry(0.5, 1, 6, 16),
  /** はんぶんの わ（まつげ・まゆ・くち） */
  arc: new THREE.TorusGeometry(1, 0.16, 6, 20, Math.PI),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 24),
  cone: new THREE.ConeGeometry(1, 1, 24),
  /** どう体（こし→むね→かた）。中心が y=0、高さ 0.4 */
  torso: lathe([[0.001, -0.2], [0.125, -0.19], [0.112, -0.1], [0.098, -0.03], [0.118, 0.06], [0.128, 0.13], [0.11, 0.18], [0.05, 0.2], [0.001, 0.2]]),
  /** ふつうの スカート（こしから下へ ひろがる） */
  skirt: lathe([[0.001, -0.015], [0.24, -0.015], [0.235, 0], [0.18, 0.12], [0.13, 0.26], [0.112, 0.3]]),
  /** ワンピースの すそ（むねから ひざ まで） */
  onepiece: lathe([[0.001, 0], [0.27, 0], [0.24, 0.06], [0.15, 0.3], [0.1, 0.42], [0.13, 0.55], [0.11, 0.62], [0.001, 0.62]]),
  /** プリンセスドレス（こしから 床まで ふんわり） */
  gown: lathe([[0.001, 0], [0.42, 0], [0.43, 0.03], [0.4, 0.12], [0.33, 0.34], [0.22, 0.62], [0.13, 0.84], [0.1, 0.92]], 36),
  /** ドレスの うわかさね（すこし みじかい） */
  overskirt: lathe([[0.37, 0.34], [0.36, 0.38], [0.26, 0.6], [0.15, 0.8], [0.11, 0.9]], 36),
};
