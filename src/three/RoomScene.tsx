import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { DEFAULT_FLOORING, DEFAULT_WALLPAPER, getFurniture } from '../game/data/catalog';
import { getSpecies } from '../game/data/species';
import { ROOM_BOUNDS, ROOM_WALL, type WallSide } from '../game/logic/life';
import type { FurnitureDef, OutfitSlot, PlacedFurniture, PlayerLook } from '../game/types';
import { Creature, type CreatureAnim } from './Creature';
import { EmojiSprite, Sparkles } from './Effects';
import { FurnitureModel } from './Furniture';
import { Heroine } from './Heroine';
import { geo, mat } from './shared';

export interface RoomFriend {
  uid: string;
  speciesId: string;
  helper?: boolean;
}

export interface RoomSceneProps {
  mode: 'home' | 'edit' | 'visit';
  placed: PlacedFurniture[];
  wallpaper?: string;
  flooring?: string;
  friends: RoomFriend[];
  player: PlayerLook;
  equipped: Record<OutfitSlot, string | null>;
  princess?: boolean;
  selectedUid?: string | null;
  /** かべの かざりを えらんでいる時は かべを ひからせる */
  highlightWalls?: boolean;
  onFloor?: (x: number, z: number) => void;
  onWall?: (wall: WallSide, x: number, z: number) => void;
  onFurniture?: (uid: string) => void;
  onFriend?: (uid: string) => void;
  reduceMotion?: boolean;
}

const SIZE = ROOM_WALL * 2;
const WALL_H = 4.2;

// ---------- かべがみ・ゆかの もよう（canvas で かいて テクスチャに する）----------

const texCache = new Map<string, THREE.CanvasTexture>();

function drawHeart(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath();
  g.moveTo(x, y + r * 0.9);
  g.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.6, y - r * 1.1, x, y - r * 0.35);
  g.bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9);
  g.fill();
}
function drawStar(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.fill();
}
function drawCloud(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath();
  for (const [dx, dy, rr] of [[-0.8, 0.2, 0.55], [0, 0, 0.8], [0.8, 0.2, 0.55], [0, 0.35, 0.6]]) g.arc(x + dx * r, y + dy * r, rr * r, 0, Math.PI * 2);
  g.fill();
}

function surfaceTexture(def: FurnitureDef): THREE.CanvasTexture {
  const hit = texCache.get(def.id);
  if (hit) return hit;
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d')!;
  const c2 = def.color2 ?? '#ffffff';
  g.fillStyle = def.color;
  g.fillRect(0, 0, S, S);
  g.fillStyle = c2;
  g.strokeStyle = c2;
  switch (def.pattern) {
    case 'stripe':
      g.fillRect(0, 0, S / 4, S);
      g.fillRect(S / 2, 0, S / 4, S);
      break;
    case 'dot':
      for (const [x, y] of [[S / 4, S / 4], [(S * 3) / 4, (S * 3) / 4]]) {
        g.beginPath();
        g.arc(x, y, S / 10, 0, Math.PI * 2);
        g.fill();
      }
      break;
    case 'check':
      g.fillRect(0, 0, S / 2, S / 2);
      g.fillRect(S / 2, S / 2, S / 2, S / 2);
      break;
    case 'heart':
      drawHeart(g, S / 4, S / 4, S / 9);
      drawHeart(g, (S * 3) / 4, (S * 3) / 4, S / 9);
      break;
    case 'star':
      drawStar(g, S / 4, S / 4, S / 9);
      drawStar(g, (S * 3) / 4, (S * 3) / 4, S / 14);
      break;
    case 'cloud':
      drawCloud(g, S / 3, S / 3, S / 8);
      drawCloud(g, (S * 3) / 4, (S * 4) / 5, S / 11);
      break;
    case 'wood':
      for (let i = 0; i < 4; i++) {
        g.fillStyle = i % 2 ? c2 : def.color;
        g.fillRect(0, (i * S) / 4, S, S / 4);
        g.fillStyle = 'rgba(120,80,50,0.18)';
        g.fillRect(0, (i * S) / 4, S, 2);
        g.fillRect(((i * 37) % 4) * (S / 4) + S / 8, (i * S) / 4, 2, S / 4);
      }
      break;
    default:
      // 無地は うっすら ひしがた
      g.globalAlpha = 0.5;
      g.beginPath();
      g.moveTo(S / 2, S / 4);
      g.lineTo((S * 3) / 4, S / 2);
      g.lineTo(S / 2, (S * 3) / 4);
      g.lineTo(S / 4, S / 2);
      g.closePath();
      g.stroke();
      g.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  texCache.set(def.id, tex);
  return tex;
}

/** 1マス 2m で くりかえす もようの マテリアル */
function useSurfaceMaterial(id: string, fallback: string, w: number, h: number) {
  const mtl = useMemo(() => {
    const def = getFurniture(id) ?? getFurniture(fallback)!;
    const tex = surfaceTexture(def).clone();
    tex.needsUpdate = true;
    tex.repeat.set(w / 2, h / 2);
    return new THREE.MeshLambertMaterial({ map: tex });
  }, [id, fallback, w, h]);
  useEffect(() => () => {
    mtl.map?.dispose();
    mtl.dispose();
  }, [mtl]);
  return mtl;
}

// ---------- へや ----------

function Room({ wallpaper, flooring, highlightWalls, onFloor, onWall }: Pick<RoomSceneProps, 'highlightWalls' | 'onFloor' | 'onWall'> & { wallpaper: string; flooring: string }) {
  const floorMat = useSurfaceMaterial(flooring, DEFAULT_FLOORING, SIZE, SIZE);
  const wallMat = useSurfaceMaterial(wallpaper, DEFAULT_WALLPAPER, SIZE, WALL_H);
  const glow = mat('#fff27a', { transparent: 0.35 });
  return (
    <group>
      {/* ゆかの 土台（ジオラマの あつみ） */}
      <mesh geometry={geo.box} material={mat('#f6dcc4')} position={[0, -0.25, 0]} scale={[SIZE + 0.4, 0.5, SIZE + 0.4]} />
      <mesh
        geometry={geo.plane}
        material={floorMat}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        scale={[SIZE, SIZE, 1]}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          if (!onFloor) return;
          e.stopPropagation();
          onFloor(e.point.x, e.point.z);
        }}
      />
      {/* おくの かべ */}
      <mesh geometry={geo.box} material={mat('#fbe8f1')} position={[0, WALL_H / 2, -ROOM_WALL - 0.2]} scale={[SIZE + 0.4, WALL_H, 0.4]} />
      <mesh
        geometry={geo.plane}
        material={wallMat}
        position={[0, WALL_H / 2, -ROOM_WALL + 0.001]}
        scale={[SIZE, WALL_H, 1]}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          if (!onWall) return;
          e.stopPropagation();
          onWall('back', e.point.x, e.point.z);
        }}
      />
      {/* ひだりの かべ */}
      <mesh geometry={geo.box} material={mat('#fbe8f1')} position={[-ROOM_WALL - 0.2, WALL_H / 2, 0]} scale={[0.4, WALL_H, SIZE + 0.4]} />
      <mesh
        geometry={geo.plane}
        material={wallMat}
        position={[-ROOM_WALL + 0.001, WALL_H / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[SIZE, WALL_H, 1]}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          if (!onWall) return;
          e.stopPropagation();
          onWall('left', e.point.x, e.point.z);
        }}
      />
      {highlightWalls && (
        <>
          <mesh geometry={geo.plane} material={glow} position={[0, WALL_H / 2, -ROOM_WALL + 0.02]} scale={[SIZE, WALL_H, 1]} />
          <mesh geometry={geo.plane} material={glow} position={[-ROOM_WALL + 0.02, WALL_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[SIZE, WALL_H, 1]} />
        </>
      )}
      {/* はばき と かべの うえの ふち */}
      <mesh geometry={geo.box} material={mat('#ffffff')} position={[0, 0.12, -ROOM_WALL + 0.03]} scale={[SIZE, 0.24, 0.06]} />
      <mesh geometry={geo.box} material={mat('#ffffff')} position={[-ROOM_WALL + 0.03, 0.12, 0]} scale={[0.06, 0.24, SIZE]} />
      <mesh geometry={geo.box} material={mat('#ffc6dc')} position={[0, WALL_H + 0.06, -ROOM_WALL - 0.2]} scale={[SIZE + 0.5, 0.14, 0.5]} />
      <mesh geometry={geo.box} material={mat('#ffc6dc')} position={[-ROOM_WALL - 0.2, WALL_H + 0.06, 0]} scale={[0.5, 0.14, SIZE + 0.5]} />
    </group>
  );
}

/** おいた物の いちと むき。かべの かざりは かべに そって 前を むく */
function placement(p: PlacedFurniture): { position: [number, number, number]; rotation: [number, number, number] } {
  if (p.wall === 'back') return { position: [p.x, 0, -ROOM_WALL + 0.01], rotation: [0, 0, 0] };
  if (p.wall === 'left') return { position: [-ROOM_WALL + 0.01, 0, p.z], rotation: [0, Math.PI / 2, 0] };
  return { position: [p.x, 0, p.z], rotation: [0, ((p.rot ?? 0) * Math.PI) / 2, 0] };
}

// ---------- なかま ----------

interface Wander {
  x: number;
  z: number;
  tx: number;
  tz: number;
  wait: number;
  anim: CreatureAnim;
}

function RoomFriendActor({ friend, index, rests, onFriend, reduceMotion }: { friend: RoomFriend; index: number; rests: { x: number; z: number; kind: 'sit' | 'sleep' }[]; onFriend?: (uid: string) => void; reduceMotion?: boolean }) {
  const g = useRef<THREE.Group>(null);
  const anim = useRef<CreatureAnim>('idle');
  const st = useRef<Wander>({ x: -3 + (index % 4) * 2, z: 0.5 + Math.floor(index / 4) * 2, tx: 0, tz: 0, wait: 1 + index, anim: 'idle' });
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
        const rs = restsRef.current;
        if (rs.length > 0 && Math.random() < 0.35) {
          const rest = rs[Math.floor(Math.random() * rs.length)];
          s.tx = rest.x + 0.3;
          s.tz = rest.z + 0.4;
          s.anim = rest.kind === 'sleep' ? 'sleep' : 'love';
        } else {
          s.tx = ROOM_BOUNDS.minX + 0.5 + Math.random() * (ROOM_BOUNDS.maxX - ROOM_BOUNDS.minX - 1);
          s.tz = ROOM_BOUNDS.minZ + 1 + Math.random() * (ROOM_BOUNDS.maxZ - ROOM_BOUNDS.minZ - 1.5);
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
        const sp = Math.min(d, 1.2 * dt);
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
      <Creature look={look} animRef={anim} scale={0.8} />
      {friend.helper && <EmojiSprite emoji="🔍" position={[0, 1.5, 0]} size={0.4} />}
    </group>
  );
}

// ---------- ぜんたい ----------

export function RoomScene(props: RoomSceneProps) {
  const { mode, placed, selectedUid, onFurniture, onFriend } = props;
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    // てまえ みぎ から、おくの かべと ひだりの かべが みえる ように 見下ろす（ジオラマ）
    if (mode === 'edit') {
      camera.position.set(6.6, 11.6, 9.4);
      camera.lookAt(-0.6, 0.4, -0.6);
    } else if (mode === 'visit') {
      // ともだちの おうちは ひくい わくの なかで みるので すこし ちかよる
      camera.position.set(6.2, 7, 8.6);
      camera.lookAt(-0.4, 0.6, 0);
    } else {
      camera.position.set(8.3, 9.4, 11.4);
      camera.lookAt(-0.4, 0.5, 0.2);
    }
  }, [camera, mode]);

  const rests = useMemo(
    () =>
      placed.flatMap((p) => {
        const def = getFurniture(p.furnitureId);
        return def?.rest && !p.wall ? [{ x: p.x, z: p.z, kind: def.rest }] : [];
      }),
    [placed],
  );
  // ラグは 先に かいて、上の かぐと かさなっても ちらつかない ように する
  const sorted = useMemo(() => [...placed].sort((a, b) => Number(getFurniture(b.furnitureId)?.kind === 'rug') - Number(getFurniture(a.furnitureId)?.kind === 'rug')), [placed]);

  return (
    <>
      <color attach="background" args={[mode === 'visit' ? '#eef4ff' : '#fff1f7']} />
      <hemisphereLight args={['#fff6fb', '#f3dcc8', 2.2]} />
      <directionalLight position={[6, 10, 8]} intensity={1.3} color="#fff4e0" />
      <Room
        wallpaper={props.wallpaper ?? DEFAULT_WALLPAPER}
        flooring={props.flooring ?? DEFAULT_FLOORING}
        highlightWalls={props.highlightWalls}
        onFloor={props.onFloor}
        onWall={props.onWall}
      />
      {mode === 'edit' && <gridHelper args={[SIZE, SIZE * 2, '#ffb3d1', '#ffd6e7']} position={[0, 0.02, 0]} />}
      {sorted.map((p) => {
        const def = getFurniture(p.furnitureId);
        if (!def) return null;
        const at = placement(p);
        return (
          <group
            key={p.uid}
            {...at}
            onPointerDown={(e) => {
              if (!onFurniture) return;
              e.stopPropagation();
              onFurniture(p.uid);
            }}
          >
            <FurnitureModel def={def} />
            {selectedUid === p.uid &&
              (p.wall ? (
                <mesh geometry={geo.torus} material={mat('#ff5fa2', { emissive: '#802050' })} position={[0, 2.4, 0.15]} scale={[0.9, 0.9, 0.3]} />
              ) : (
                <>
                  <mesh geometry={geo.torus} material={mat('#ff5fa2', { emissive: '#802050' })} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} scale={[0.75, 0.75, 0.3]} />
                  <Sparkles count={10} radius={0.7} height={1.4} color="#ffd1e3" />
                </>
              ))}
            {def.kind === 'light' && mode !== 'edit' && <pointLight position={[0, 1.3, 0]} color={def.color} intensity={2} distance={3} />}
          </group>
        );
      })}
      {mode !== 'edit' &&
        props.friends.slice(0, 8).map((f, i) => (
          <RoomFriendActor key={f.uid} friend={f} index={i} rests={rests} onFriend={onFriend} reduceMotion={props.reduceMotion} />
        ))}
      <Heroine look={props.player} equipped={props.equipped} princess={props.princess} position={[2.4, 0, 2.2]} rotation={[0, 0.5, 0]} />
    </>
  );
}
