import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { getFurniture } from '../game/data/catalog';
import { getSeed } from '../game/data/items';
import { getSpecies } from '../game/data/species';
import { TOWN_BOUNDS } from '../game/logic/life';
import type { OutfitSlot, PlacedFurniture, PlayerLook } from '../game/types';
import { Creature, type CreatureAnim } from './Creature';
import { EmojiSprite, Petals, Sparkles } from './Effects';
import { FurnitureModel } from './Furniture';
import { Heroine } from './Heroine';
import { geo, mat } from './shared';

export interface TownFriend {
  uid: string;
  speciesId: string;
  helper?: boolean;
}
export interface TownPlot {
  seedId: string | null;
  progress: number;
}

export interface TownSceneProps {
  mode: 'home' | 'edit' | 'visit';
  placed: PlacedFurniture[];
  friends: TownFriend[];
  plots: TownPlot[];
  player: PlayerLook;
  equipped: Record<OutfitSlot, string | null>;
  princess?: boolean;
  selectedUid?: string | null;
  /** 置く場所の プレビュー（まちづくり中） */
  ghost?: { furnitureId: string; x: number; z: number } | null;
  onGround?: (x: number, z: number) => void;
  onFurniture?: (uid: string) => void;
  onFriend?: (uid: string) => void;
  onPlot?: (index: number) => void;
  reduceMotion?: boolean;
}

export const PLOT_POS = Array.from({ length: 6 }, (_, i) => ({ x: -5 + i * 2, z: 8.2 }));

function House() {
  return (
    <group position={[0, 0, -9]}>
      <mesh geometry={geo.box} material={mat('#fff3e6')} position={[0, 1.5, 0]} scale={[5, 3, 3]} />
      <mesh geometry={geo.cone} material={mat('#ff9ec7')} position={[0, 4, 0]} scale={[4, 2, 2.6]} rotation={[0, Math.PI / 4, 0]} />
      <mesh geometry={geo.box} material={mat('#c9a0ff')} position={[0, 0.9, 1.52]} scale={[1, 1.8, 0.05]} />
      <mesh geometry={geo.heart} material={mat('#ff7fae')} position={[0, 2.3, 1.56]} scale={0.25} />
      {[-1.6, 1.6].map((x) => (
        <mesh key={x} geometry={geo.circle} material={mat('#bfe6ff')} position={[x, 1.8, 1.52]} scale={0.45} />
      ))}
    </group>
  );
}

function Plot({ plot, index, onPlot }: { plot: TownPlot; index: number; onPlot?: (i: number) => void }) {
  const p = PLOT_POS[index];
  const seed = plot.seedId ? getSeed(plot.seedId) : undefined;
  const h = 0.15 + plot.progress * 0.6;
  return (
    <group
      position={[p.x, 0, p.z]}
      onPointerDown={(e) => {
        if (!onPlot) return;
        e.stopPropagation();
        onPlot(index);
      }}
    >
      <mesh geometry={geo.box} material={mat('#c99b74')} position={[0, 0.1, 0]} scale={[1.6, 0.2, 1.4]} />
      <mesh geometry={geo.box} material={mat('#8a6248')} position={[0, 0.21, 0]} scale={[1.4, 0.04, 1.2]} />
      {seed && (
        <>
          <mesh geometry={geo.cylinder} material={mat('#7ed69a')} position={[0, 0.2 + h / 2, 0]} scale={[0.05, h, 0.05]} />
          {plot.progress >= 1 ? (
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <mesh key={i} geometry={geo.sphereLow} material={mat(seed.color)} position={[Math.cos(i * 1.256) * 0.16, 0.25 + h, Math.sin(i * 1.256) * 0.16]} scale={0.13} />
              ))}
              <mesh geometry={geo.sphereLow} material={mat('#fff3a0')} position={[0, 0.28 + h, 0]} scale={0.1} />
              <EmojiSprite emoji="✨" position={[0, 1.6, 0]} size={0.5} />
            </>
          ) : (
            <mesh geometry={geo.sphereLow} material={mat('#9be3b0')} position={[0, 0.2 + h, 0]} scale={[0.15, 0.08, 0.15]} />
          )}
        </>
      )}
    </group>
  );
}

interface Wander {
  x: number;
  z: number;
  tx: number;
  tz: number;
  wait: number;
  anim: CreatureAnim;
}

function TownFriendActor({ friend, index, rests, onFriend, reduceMotion }: { friend: TownFriend; index: number; rests: { x: number; z: number; kind: 'sit' | 'sleep' }[]; onFriend?: (uid: string) => void; reduceMotion?: boolean }) {
  const g = useRef<THREE.Group>(null);
  const anim = useRef<CreatureAnim>('idle');
  const st = useRef<Wander>({ x: -3 + (index % 4) * 2, z: 1 + Math.floor(index / 4) * 2, tx: 0, tz: 0, wait: 1 + index, anim: 'idle' });
  const restsRef = useRef(rests);
  restsRef.current = rests;
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = st.current;
    const node = g.current;
    if (!node) return;
    if (reduceMotion) {
      node.position.set(s.x, 0, s.z);
      anim.current = 'idle';
      return;
    }
    if (s.wait > 0) {
      s.wait -= dt;
      if (s.wait <= 0) {
        // 次に何をするか: 歩く / 座る / ねる
        const r = Math.random();
        const rs = restsRef.current;
        if (rs.length > 0 && r < 0.3) {
          const rest = rs[Math.floor(Math.random() * rs.length)];
          s.tx = rest.x + 0.3;
          s.tz = rest.z + 0.4;
          s.anim = rest.kind === 'sleep' ? 'sleep' : 'love';
        } else {
          s.tx = TOWN_BOUNDS.minX + Math.random() * (TOWN_BOUNDS.maxX - TOWN_BOUNDS.minX);
          s.tz = TOWN_BOUNDS.minZ + 1 + Math.random() * (TOWN_BOUNDS.maxZ - TOWN_BOUNDS.minZ - 1);
          s.anim = Math.random() < 0.3 ? 'happy' : 'idle';
        }
        anim.current = 'walk';
      }
    } else {
      const dx = s.tx - s.x;
      const dz = s.tz - s.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.1) {
        anim.current = s.anim;
        s.wait = s.anim === 'sleep' ? 8 + Math.random() * 6 : 2 + Math.random() * 4;
      } else {
        const sp = Math.min(d, 1.4 * dt);
        s.x += (dx / d) * sp;
        s.z += (dz / d) * sp;
        node.rotation.y = Math.atan2(dx, dz);
        anim.current = 'walk';
      }
    }
    node.position.set(s.x, 0, s.z);
  });
  const look = getSpecies(friend.speciesId).look;
  return (
    <group
      ref={g}
      onPointerDown={(e) => {
        if (!onFriend) return;
        e.stopPropagation();
        onFriend(friend.uid);
      }}
    >
      <Creature look={look} animRef={anim} scale={0.9} />
      {friend.helper && <EmojiSprite emoji="🔍" position={[0, 1.6, 0]} size={0.45} />}
    </group>
  );
}

export function TownScene(props: TownSceneProps) {
  const { mode, placed, friends, plots, selectedUid, ghost, onGround, onFurniture, onFriend, onPlot } = props;
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    // ホームの キャンバスは メニューの上だけに あるので、まち全体が入るように 見下ろす
    if (mode === 'edit') {
      camera.position.set(0, 17, 12);
      camera.lookAt(0, 0, 2.6);
    } else if (mode === 'home') {
      camera.position.set(0, 21, 21);
      camera.lookAt(0, 0, -2.2);
    } else {
      camera.position.set(0, 15, 14);
      camera.lookAt(0, 0, 0.5);
    }
  }, [camera, mode]);

  const rests = useMemo(
    () =>
      placed.flatMap((p) => {
        const def = getFurniture(p.furnitureId);
        return def?.rest ? [{ x: p.x, z: p.z, kind: def.rest }] : [];
      }),
    [placed],
  );
  const petalTarget = useRef({ x: 0, z: 0 } as THREE.Vector3);
  const ghostDef = ghost ? getFurniture(ghost.furnitureId) : undefined;
  const W = TOWN_BOUNDS.maxX - TOWN_BOUNDS.minX;
  const D = TOWN_BOUNDS.maxZ - TOWN_BOUNDS.minZ;

  return (
    <>
      <color attach="background" args={[mode === 'visit' ? '#eef4ff' : '#fff1f7']} />
      <fog attach="fog" args={[mode === 'visit' ? '#eef4ff' : '#fff1f7', 26, 50]} />
      <hemisphereLight args={['#fff6fb', '#bfe8b8', 2.3]} />
      <directionalLight position={[5, 10, 7]} intensity={1.5} color="#fff4e0" />
      {/* じめん */}
      <mesh
        geometry={geo.plane}
        material={mat('#d3f0c6')}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[60, 60, 1]}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => onGround?.(e.point.x, e.point.z)}
      />
      {/* かざれる エリア */}
      <mesh geometry={geo.plane} material={mat(mode === 'edit' ? '#fff7d6' : '#e6f7da')} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} scale={[W + 1, D + 1, 1]} />
      {mode === 'edit' && <gridHelper args={[W + 1, (W + 1) * 2, '#ffb3d1', '#ffd6e7']} position={[0, 0.02, 0]} />}
      <mesh geometry={geo.plane} material={mat('#f6e3c4')} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -7]} scale={[2, 3, 1]} />
      <House />
      {plots.map((p, i) => (
        <Plot key={i} plot={p} index={i} onPlot={mode === 'home' ? onPlot : undefined} />
      ))}
      {placed.map((p) => {
        const def = getFurniture(p.furnitureId);
        if (!def) return null;
        return (
          <group
            key={p.uid}
            position={[p.x, 0, p.z]}
            rotation={[0, (p.rot * Math.PI) / 2, 0]}
            onPointerDown={(e) => {
              if (!onFurniture) return;
              e.stopPropagation();
              onFurniture(p.uid);
            }}
          >
            <FurnitureModel def={def} />
            {selectedUid === p.uid && (
              <>
                <mesh geometry={geo.torus} material={mat('#ff5fa2', { emissive: '#802050' })} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} scale={[0.75, 0.75, 0.3]} />
                <Sparkles count={10} radius={0.7} height={1.4} color="#ffd1e3" />
              </>
            )}
            {def.kind === 'light' && mode !== 'edit' && <pointLight position={[0, 1.3, 0]} color={def.color} intensity={2} distance={3} />}
          </group>
        );
      })}
      {ghost && ghostDef && (
        <group position={[ghost.x, 0, ghost.z]}>
          <FurnitureModel def={ghostDef} />
          <mesh geometry={geo.circle} material={mat('#ff8fbf', { transparent: 0.4 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} scale={0.7} />
        </group>
      )}
      {mode !== 'edit' &&
        friends.slice(0, 8).map((f, i) => (
          <TownFriendActor key={f.uid} friend={f} index={i} rests={rests} onFriend={onFriend} reduceMotion={props.reduceMotion} />
        ))}
      <Heroine look={props.player} equipped={props.equipped} princess={props.princess} position={[1.6, 0, -6.6]} rotation={[0, -0.3, 0]} />
      {!props.reduceMotion && <Petals target={petalTarget} count={50} area={20} />}
    </>
  );
}
