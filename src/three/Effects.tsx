import { useFrame, type ThreeElements } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { emojiMaterial } from './shared';

let sparkleTex: THREE.Texture | null = null;
function sparkleTexture(): THREE.Texture {
  if (sparkleTex) return sparkleTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.8)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.fillRect(30, 4, 4, 56);
  g.fillRect(4, 30, 56, 4);
  sparkleTex = new THREE.CanvasTexture(c);
  return sparkleTex;
}

/** まわりを くるくる まわる キラキラ */
export function Sparkles({ count = 20, radius = 1, height = 1.5, color = '#ffffff', size = 0.16, ...props }: { count?: number; radius?: number; height?: number; color?: string; size?: number } & ThreeElements['group']) {
  const ref = useRef<THREE.Points>(null);
  const { geometry, material, seeds } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color, size, map: sparkleTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const sd = Array.from({ length: count }, () => [Math.random() * Math.PI * 2, Math.random() * height, 0.5 + Math.random() * 0.8]);
    return { geometry: g, material: m, seeds: sd };
  }, [count, color, size, height]);
  useFrame(({ clock }) => {
    const p = ref.current;
    if (!p) return;
    const t = clock.elapsedTime;
    const arr = (p.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < count; i++) {
      const [a, h, sp] = seeds[i];
      const ang = a + t * sp;
      arr[i * 3] = Math.cos(ang) * radius;
      arr[i * 3 + 1] = (h + t * 0.4 * sp) % height;
      arr[i * 3 + 2] = Math.sin(ang) * radius;
    }
    p.geometry.attributes.position.needsUpdate = true;
    material.opacity = 0.6 + Math.sin(t * 6) * 0.3;
  });
  return (
    <group {...props}>
      <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}

/** ひらひら落ちる 花びら。target が動くと その周りに降る */
export function Petals({ count = 90, area = 22, color = '#ffc0da', target }: { count?: number; area?: number; color?: string; target?: { current: THREE.Vector3 } }) {
  const ref = useRef<THREE.Points>(null);
  const { geometry, material, data } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const d = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * area;
      pos[i * 3 + 1] = Math.random() * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * area;
      d[i * 4] = Math.random() * 10;
      d[i * 4 + 1] = 0.4 + Math.random() * 0.5;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color, size: 0.18, map: sparkleTexture(), transparent: true, depthWrite: false, opacity: 0.9 });
    return { geometry: g, material: m, data: d };
  }, [count, area, color]);
  useFrame(({ clock }, dt) => {
    const p = ref.current;
    if (!p) return;
    const t = clock.elapsedTime;
    const arr = (p.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const cx = target?.current.x ?? 0;
    const cz = target?.current.z ?? 0;
    const step = Math.min(dt, 0.05);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= data[i * 4 + 1] * step;
      arr[i * 3] += Math.sin(t + data[i * 4]) * 0.4 * step;
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3] = cx + (Math.random() - 0.5) * area;
        arr[i * 3 + 2] = cz + (Math.random() - 0.5) * area;
        arr[i * 3 + 1] = 7 + Math.random() * 2;
      }
    }
    p.geometry.attributes.position.needsUpdate = true;
  });
  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}

/** 絵文字のビルボード（いつもカメラを向く） */
export function EmojiSprite({ emoji, bg, size = 0.6, bob = true, ...props }: { emoji: string; bg?: string; size?: number; bob?: boolean } & ThreeElements['group']) {
  const ref = useRef<THREE.Sprite>(null);
  const phase = useMemo(() => Math.random() * 6, []);
  useFrame(({ clock }) => {
    if (ref.current && bob) ref.current.position.y = Math.sin(clock.elapsedTime * 2.5 + phase) * 0.1;
  });
  return (
    <group {...props}>
      <sprite ref={ref} material={emojiMaterial(emoji, bg)} scale={[size, size, size]} />
    </group>
  );
}
