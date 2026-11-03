// 3つめ いこうの ワールドの けしき。WorldMap.theme の データ（いろ・かざりの しゅるい・めじるし）から つくる。
import type { ThreeEvent } from '@react-three/fiber';
import { useMemo } from 'react';
import type { DecorKind, LandmarkKind, WorldMap, WorldTheme } from '../game/data/forest';
import { ABILITY_INFO } from '../game/data/species';
import { themeLayout } from '../game/themeLayout';
import { Instanced } from './ForestScene';
import { EmojiSprite, Sparkles } from './Effects';
import { geo, mat } from './shared';
import type * as THREE from 'three';

type Pt = { x: number; z: number; s?: number };
interface Layer {
  geometry: THREE.BufferGeometry;
  scale: [number, number, number];
  y: number;
  /** なければ かざりの いろ（decorColors）を つかう */
  color?: string;
  dx?: number;
  dz?: number;
}

/** かざりの しゅるいごとの くみたて（Instanced の かさね） */
const DECOR: Record<DecorKind, Layer[]> = {
  lollipop: [
    { geometry: geo.cylinder, scale: [0.08, 1.7, 0.08], y: 0.85, color: '#ffffff' },
    { geometry: geo.sphere, scale: [0.62, 0.62, 0.2], y: 2, dx: 0 },
    { geometry: geo.cylinder, scale: [0.42, 0.45, 0.42], y: 0.22, color: '#f6d2a8', dx: 0.8, dz: 0.5 },
    { geometry: geo.sphereLow, scale: [0.42, 0.3, 0.42], y: 0.5, dx: 0.8, dz: 0.5 },
  ],
  crystal: [
    { geometry: geo.octa, scale: [0.45, 1.3, 0.45], y: 1.15 },
    { geometry: geo.octa, scale: [0.28, 0.8, 0.28], y: 0.7, dx: 0.55, dz: 0.3 },
    { geometry: geo.dodeca, scale: [0.6, 0.3, 0.6], y: 0.1, color: '#6d62b8' },
  ],
  tulip: [
    { geometry: geo.sphereLow, scale: [0.7, 0.35, 0.7], y: 0.2, color: '#8fd9a0' },
    { geometry: geo.cylinder, scale: [0.06, 1.1, 0.06], y: 0.6, color: '#6fbf7f' },
    { geometry: geo.sphereLow, scale: [0.34, 0.46, 0.34], y: 1.25 },
    { geometry: geo.cylinder, scale: [0.05, 0.8, 0.05], y: 0.45, color: '#6fbf7f', dx: 0.45, dz: 0.2 },
    { geometry: geo.sphereLow, scale: [0.26, 0.34, 0.26], y: 0.9, dx: 0.45, dz: 0.2 },
  ],
  tower: [
    { geometry: geo.cylinder, scale: [0.55, 2.4, 0.55], y: 1.2 },
    { geometry: geo.cone, scale: [0.78, 1.1, 0.78], y: 2.95, color: '#c9a8ff' },
    { geometry: geo.box, scale: [0.22, 0.4, 0.12], y: 1.7, color: '#8fd3ff', dz: 0.52 },
  ],
  mushroom: [
    { geometry: geo.cylinder, scale: [0.22, 1.1, 0.22], y: 0.55, color: '#fff3dc' },
    { geometry: geo.sphereLow, scale: [0.8, 0.45, 0.8], y: 1.1 },
    { geometry: geo.cylinder, scale: [0.12, 0.5, 0.12], y: 0.25, color: '#fff3dc', dx: 0.6, dz: 0.4 },
    { geometry: geo.sphereLow, scale: [0.38, 0.22, 0.38], y: 0.52, dx: 0.6, dz: 0.4 },
  ],
};

function DecorLayers({ kind, items, colors }: { kind: DecorKind; items: { x: number; z: number; s: number; c: number }[]; colors: string[] }) {
  const tint = useMemo(() => items.map((d) => colors[d.c % colors.length]), [items, colors]);
  const layers = DECOR[kind];
  const shifted = useMemo(
    () => layers.map((l) => (l.dx || l.dz ? items.map((d) => ({ x: d.x + (l.dx ?? 0) * d.s, z: d.z + (l.dz ?? 0) * d.s, s: d.s })) : (items as Pt[]))),
    [layers, items],
  );
  return (
    <>
      {layers.map((l, i) => (
        <Instanced key={i} items={shifted[i]} geometry={l.geometry} color={l.color ?? '#ffffff'} scale={l.scale} y={l.y} colors={l.color ? undefined : tint} />
      ))}
    </>
  );
}

function Landmark({ kind, theme }: { kind: LandmarkKind; theme: WorldTheme }) {
  const c = theme.decorColors;
  switch (kind) {
    case 'cake':
      return (
        <>
          {[[2, '#fff1e6'], [1.5, '#ffd1e3'], [1, '#ffffff']].map(([r, col], i) => (
            <mesh key={i} geometry={geo.cylinder} material={mat(col as string)} position={[0, 0.45 + i * 0.85, 0]} scale={[r as number, 0.85, r as number]} />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <mesh key={i} geometry={geo.sphereLow} material={mat(c[i % c.length])} position={[Math.cos(i * 0.785) * 2, 0.9, Math.sin(i * 0.785) * 2]} scale={0.22} />
          ))}
          <mesh geometry={geo.sphere} material={mat('#ff5f7f')} position={[0, 2.85, 0]} scale={0.38} />
          <Sparkles position={[0, 3, 0]} count={10} radius={0.8} height={1} color={theme.sparkle} />
        </>
      );
    case 'moon':
      return (
        <>
          <mesh geometry={geo.dodeca} material={mat('#6d62b8')} position={[0, 0.4, 0]} scale={[1.8, 0.6, 1.8]} />
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} geometry={geo.octa} material={mat(c[i % c.length], { emissive: '#302860' })} position={[Math.cos(i * 1.26) * 1.4, 1, Math.sin(i * 1.26) * 1.4]} scale={[0.3, 0.9, 0.3]} />
          ))}
          <mesh geometry={geo.sphere} material={mat('#fff3a8', { emissive: '#a08a30' })} position={[0, 3.6, 0]} scale={1.2} />
          <pointLight position={[0, 3.6, 1.5]} color="#fff3c0" intensity={10} distance={10} />
        </>
      );
    case 'fountain':
      return (
        <>
          <mesh geometry={geo.cylinder} material={mat('#f3eeff')} position={[0, 0.25, 0]} scale={[2.2, 0.5, 2.2]} />
          <mesh geometry={geo.circle} material={mat('#a8e4ff')} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.52, 0]} scale={1.9} />
          <mesh geometry={geo.cylinder} material={mat('#ffffff')} position={[0, 1.1, 0]} scale={[0.3, 1.4, 0.3]} />
          <mesh geometry={geo.sphereLow} material={mat('#f3eeff')} position={[0, 1.85, 0]} scale={[0.9, 0.3, 0.9]} />
          <Sparkles position={[0, 1.6, 0]} count={18} radius={0.9} height={1.4} color="#bff0ff" />
        </>
      );
    case 'castle':
      return (
        <>
          <mesh geometry={geo.box} material={mat('#ffffff')} position={[0, 1.2, 0]} scale={[3.2, 2.4, 2.6]} />
          <mesh geometry={geo.box} material={mat('#ffc6e0')} position={[0, 0.7, 1.32]} scale={[0.9, 1.4, 0.1]} />
          {[[-1.6, -1.3], [1.6, -1.3], [-1.6, 1.3], [1.6, 1.3]].map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <mesh geometry={geo.cylinder} material={mat('#fff6fb')} position={[0, 1.8, 0]} scale={[0.55, 3.6, 0.55]} />
              <mesh geometry={geo.cone} material={mat('#ff9ec7')} position={[0, 4.1, 0]} scale={[0.8, 1.2, 0.8]} />
            </group>
          ))}
          <mesh geometry={geo.cone} material={mat('#c9a8ff')} position={[0, 3.1, 0]} scale={[1.6, 1.4, 1.4]} />
          <EmojiSprite emoji="👑" position={[0, 4.4, 0]} size={0.6} />
        </>
      );
    case 'bigshroom':
      return (
        <>
          <mesh geometry={geo.cylinder} material={mat('#fff3dc')} position={[0, 1.5, 0]} scale={[0.8, 3, 0.8]} />
          <mesh geometry={geo.sphere} material={mat('#ff7f8f')} position={[0, 3.2, 0]} scale={[2.4, 1.2, 2.4]} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={i} geometry={geo.sphereLow} material={mat('#ffffff')} position={[Math.cos(i * 1.05) * 1.5, 3.85, Math.sin(i * 1.05) * 1.5]} scale={[0.32, 0.14, 0.32]} />
          ))}
          <Sparkles position={[0, 2, 0]} count={16} radius={2.4} height={2.5} color={theme.sparkle} />
        </>
      );
  }
}

export function ThemeScenery({ world, solved, onGround }: { world: WorldMap; solved: string[]; onGround: (e: ThreeEvent<PointerEvent>) => void }) {
  const theme = world.theme!;
  const L = themeLayout(world);
  const b = world.bounds;
  const dotColors = useMemo(() => L.dots.map((d) => theme.decorColors[d.c % theme.decorColors.length]), [L, theme]);
  const lm = theme.landmark;
  return (
    <>
      <color attach="background" args={[theme.bg]} />
      <fog attach="fog" args={[theme.bg, theme.night ? 20 : 24, theme.night ? 46 : 52]} />
      <hemisphereLight args={[theme.sky, theme.groundLight, theme.night ? 2.3 : 2.3]} />
      <directionalLight position={[6, 12, 8]} intensity={theme.night ? 1.3 : 1.6} color={theme.sun} />
      {theme.night && <Sparkles position={[0, 9, (b.minZ + b.maxZ) / 2]} count={90} radius={28} height={6} color="#ffffff" size={0.22} />}

      {/* じめん（タップした場所へ歩く）と みち */}
      <mesh geometry={geo.plane} material={mat(theme.ground)} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (b.minZ + b.maxZ) / 2]} scale={[80, 80, 1]} onPointerDown={onGround} />
      <mesh geometry={geo.plane} material={mat(theme.path)} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, (b.maxZ - 2 + b.minZ + 4) / 2]} scale={[2.6, b.maxZ - b.minZ - 2, 1]} />
      <mesh geometry={geo.circle} material={mat(theme.path)} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, -20.5]} scale={6.2} />
      <Instanced items={L.dots} geometry={geo.sphereLow} color="#ffffff" scale={[0.12, 0.04, 0.12]} y={0.04} colors={dotColors} />

      <DecorLayers kind={theme.decor} items={L.decor} colors={theme.decorColors} />

      <group position={[lm.x, 0, lm.z]}>
        <Landmark kind={lm.kind} theme={theme} />
      </group>

      {/* ちからで とく しかけ（とけるまで みちを ふさぐ） */}
      {world.puzzles.filter((p) => p.ability).map((p) =>
        solved.includes(p.id) ? (
          <Sparkles key={p.id} position={[p.x, 0.3, p.z]} count={8} radius={0.6} height={0.8} color={theme.sparkle} />
        ) : (
          <group key={p.id} position={[p.x, 0, p.z]}>
            <mesh geometry={geo.dodeca} material={mat(theme.accent)} position={[0, 0.55, 0]} scale={[0.95, 0.75, 0.95]} />
            <mesh geometry={geo.dodeca} material={mat(theme.accent)} position={[0.7, 0.35, 0.3]} scale={0.5} />
            <mesh geometry={geo.dodeca} material={mat(theme.accent)} position={[-0.6, 0.3, -0.2]} scale={0.45} />
            <EmojiSprite emoji={ABILITY_INFO[p.ability!].icon} bg="#ffffffcc" position={[0, 2, 0]} size={0.7} />
          </group>
        ),
      )}

      {/* スイッチの かんばん */}
      <group position={[world.sign.x, 0, world.sign.z]}>
        <mesh geometry={geo.cylinder} material={mat('#c99b74')} position={[0, 0.5, 0]} scale={[0.08, 1, 0.08]} />
        <mesh geometry={geo.box} material={mat('#fff8ee')} position={[0, 1.1, 0]} scale={[1.4, 0.6, 0.08]} />
        {world.switchOrder.map((id, i) => (
          <mesh key={id} geometry={geo.circle} material={mat(world.switches.find((w) => w.id === id)!.color)} position={[-0.5 + i * (1 / Math.max(1, world.switchOrder.length - 1)), 1.1, 0.05]} scale={0.1} />
        ))}
      </group>
      {/* にじの ゲート（おうちへ かえる） */}
      <group position={[world.portal.x, 0, world.portal.z]}>
        {['#ff9ec7', '#ffd84d', '#a8ead2', '#8fd3ff', '#cdb8ff'].map((col, i) => (
          <mesh key={col} geometry={geo.torus} material={mat(col)} scale={[1.9 - i * 0.18, 1.9 - i * 0.18, 0.5]} />
        ))}
        <Sparkles count={14} radius={0.9} height={2} color="#ffffff" />
      </group>
    </>
  );
}
