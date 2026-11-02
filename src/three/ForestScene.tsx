import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { FOREST } from '../game/data/forest';
import { getItem } from '../game/data/items';
import { getSpecies } from '../game/data/species';
import { forestLayout, resolveMove } from '../game/forestLayout';
import { isPickupAvailable } from '../game/logic/adventure';
import type { SaveData } from '../game/types';
import { readMove } from '../ui/Joystick';
import { Creature, type CreatureAnim } from './Creature';
import { EmojiSprite, Petals, Sparkles } from './Effects';
import { Heroine, type HeroAnim } from './Heroine';
import { geo, mat } from './shared';

export type InteractKind = 'chest' | 'puzzle' | 'switch' | 'sign' | 'encounter' | 'portal';
export interface Interactable {
  kind: InteractKind;
  id: string;
  x: number;
  z: number;
  label: string;
}

const NEAR = 2.3;
const SPEED = 5;
const HERO_R = 0.3;

export function forestInteractables(s: SaveData): Interactable[] {
  const list: Interactable[] = [{ kind: 'portal', id: 'portal', x: FOREST.portal.x, z: FOREST.portal.z, label: 'まちへ かえる' }];
  for (const c of FOREST.chests) {
    if (s.forest.openedChests.includes(c.id)) continue;
    const locked = 'lockedBy' in c && c.lockedBy && !s.forest.solvedPuzzles.includes(c.lockedBy);
    if (locked) continue; // 謎を解くまでは見えない（puzzle の方を調べる）
    list.push({ kind: 'chest', id: c.id, x: c.x, z: c.z, label: 'たからばこを あける' });
  }
  for (const p of FOREST.puzzles) {
    if (s.forest.solvedPuzzles.includes(p.id) || p.ability === null) continue;
    list.push({ kind: 'puzzle', id: p.id, x: p.x, z: p.z, label: `${p.name}を しらべる` });
  }
  if (!s.forest.solvedPuzzles.includes('p_switch')) {
    for (const sw of FOREST.switches) list.push({ kind: 'switch', id: sw.id, x: sw.x, z: sw.z, label: `${sw.name}の スイッチを おす` });
  }
  list.push({ kind: 'sign', id: 'sign', x: FOREST.sign.x, z: FOREST.sign.z, label: 'かんばんを よむ' });
  for (const e of FOREST.encounters) {
    if (s.forest.befriended.includes(e.id)) continue;
    list.push({ kind: 'encounter', id: e.id, x: e.x, z: e.z, label: 'はなしかける' });
  }
  return list;
}

function Instanced({ items, geometry, color, scale, y, colors }: { items: { x: number; z: number; s?: number }[]; geometry: THREE.BufferGeometry; color: string; scale: [number, number, number]; y: number; colors?: string[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(() => new THREE.MeshLambertMaterial({ color: colors ? '#ffffff' : color }), [color, colors]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    items.forEach((it, i) => {
      const s = it.s ?? 1;
      o.position.set(it.x, y * s, it.z);
      o.scale.set(scale[0] * s, scale[1] * s, scale[2] * s);
      o.rotation.y = (i * 1.7) % (Math.PI * 2);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      if (colors) m.setColorAt(i, c.set(colors[i % colors.length]));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items, scale, y, colors]);
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} />;
}

function Scenery({ solved, onGround }: { solved: string[]; onGround: (e: ThreeEvent<PointerEvent>) => void }) {
  const L = forestLayout();
  const b = FOREST.bounds;
  const blossomA = useMemo(() => L.trees.map((t) => ({ x: t.x, z: t.z, s: t.s })), [L]);
  const blossomB = useMemo(() => L.trees.map((t) => ({ x: t.x + 0.45 * t.s, z: t.z + 0.3 * t.s, s: t.s * 0.7 })), [L]);
  const tint = useMemo(() => L.trees.map((t) => (t.tint < 0.33 ? '#ffc6dc' : t.tint < 0.66 ? '#ffd9e8' : '#ffb3d1')), [L]);
  const flowerColors = useMemo(() => L.flowers.map((f) => f.color), [L]);
  const bushColors = useMemo(() => L.bushes.map((f) => f.color), [L]);
  const boulderSolved = solved.includes('p_boulder');
  const gateSolved = solved.includes('p_flower');
  const caveSolved = solved.includes('p_cave');
  const treeSolved = solved.includes('p_tree');
  const waterSolved = solved.includes('p_water');
  return (
    <>
      {/* じめん（タップした場所へ歩く） */}
      <mesh geometry={geo.plane} material={mat('#cdeec0')} rotation={[-Math.PI / 2, 0, 0]} position={[(b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2]} scale={[80, 80, 1]} onPointerDown={onGround} />
      {/* 小道 */}
      <mesh geometry={geo.plane} material={mat('#f6e3c4')} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -4]} scale={[2.4, 46, 1]} />
      <mesh geometry={geo.plane} material={mat('#f6e3c4')} rotation={[-Math.PI / 2, 0, 0]} position={[-4.6, 0.02, 6]} scale={[9, 1.8, 1]} />
      <mesh geometry={geo.plane} material={mat('#f6e3c4')} rotation={[-Math.PI / 2, 0, -0.5]} position={[7, 0.02, -15]} scale={[1.8, 15, 1]} />
      {/* 小川と はし */}
      <mesh geometry={geo.plane} material={mat('#a8dcff', { transparent: 0.85 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, FOREST.stream.z]} scale={[60, FOREST.stream.width, 1]} />
      <mesh geometry={geo.box} material={mat('#e8c4a0')} position={[0, 0.12, FOREST.stream.z]} scale={[2.6, 0.2, 3.6]} />
      {!waterSolved && <Sparkles position={[-6, 0.1, FOREST.stream.z]} count={14} radius={0.5} height={0.8} color="#bff0ff" />}

      {/* 木 */}
      <Instanced items={L.trees} geometry={geo.cylinder} color="#b88a6a" scale={[0.18, 1.6, 0.18]} y={0.8} />
      <Instanced items={blossomA} geometry={geo.sphereLow} color="#ffc6dc" scale={[1.05, 0.9, 1.05]} y={2.1} colors={tint} />
      <Instanced items={blossomB} geometry={geo.sphereLow} color="#ffd9e8" scale={[0.8, 0.7, 0.8]} y={2.6} colors={tint} />
      <Instanced items={L.flowers} geometry={geo.sphereLow} color="#fff" scale={[0.09, 0.06, 0.09]} y={0.06} colors={flowerColors} />
      <Instanced items={L.bushes} geometry={geo.sphereLow} color="#fff" scale={[0.5, 0.45, 0.5]} y={0.35} colors={bushColors} />
      <Instanced items={L.hedges} geometry={geo.sphereLow} color="#8fd18f" scale={[0.6, 0.75, 0.6]} y={0.6} />
      <Instanced items={L.rocks} geometry={geo.dodeca} color="#d6cce6" scale={[1, 0.7, 1]} y={0.2} />

      {/* つるの とびら */}
      <group position={[-9.6, 0, 6]}>
        {[-1, 1].map((d) => (
          <mesh key={d} geometry={geo.cylinder} material={mat('#9bd49b')} position={[0, 1, d * 1.1]} scale={[0.15, 2, 0.15]} />
        ))}
        <mesh geometry={geo.torus} material={mat(gateSolved ? '#ff9ec7' : '#7cc47c')} position={[0, 2, 0]} scale={[1.1, 1.1, 1.6]} rotation={[0, Math.PI / 2, 0]} />
        {!gateSolved && (
          <>
            {[-0.6, 0, 0.6].map((z) => (
              <mesh key={z} geometry={geo.cylinder} material={mat('#6fb86f')} position={[0, 1, z]} scale={[0.12, 2, 0.12]} rotation={[z * 0.6, 0, 0]} />
            ))}
            <EmojiSprite emoji="🌷" bg="#ffffffcc" position={[0, 2.9, 0]} size={0.7} />
          </>
        )}
        {gateSolved && <Sparkles count={10} radius={1} height={2.2} color="#ffd1e3" />}
      </group>

      {/* おおきな いわ と 隠し通路 */}
      <mesh geometry={geo.dodeca} material={mat('#c8bedb')} position={boulderSolved ? [13.2, 0.9, -6.8] : [15.5, 1.1, -4]} scale={boulderSolved ? 1 : 1.5} />
      {!boulderSolved && <EmojiSprite emoji="💪" bg="#ffffffcc" position={[15.5, 3, -4]} size={0.7} />}
      {boulderSolved && <mesh geometry={geo.plane} material={mat('#f6e3c4')} rotation={[-Math.PI / 2, 0, 0]} position={[18, 0.02, -4]} scale={[7, 1.6, 1]} />}

      {/* どうくつ */}
      <group position={[FOREST.cave.x, 0, FOREST.cave.z]}>
        <mesh geometry={geo.dodeca} material={mat('#a99cc4')} position={[0, 0.8, 0]} scale={[3.6, 2.8, 2.6]} />
        <mesh geometry={geo.circle} material={mat(caveSolved ? '#fff3c4' : '#2e2440', { emissive: caveSolved ? '#806020' : undefined })} position={[0, 1.1, 2.62]} scale={[1.3, 1.5, 1]} />
        {!caveSolved && <EmojiSprite emoji="✨" bg="#ffffffcc" position={[0, 3.6, 2.6]} size={0.7} />}
        {caveSolved && <pointLight position={[0, 1.5, 3.5]} color="#ffe9a8" intensity={6} distance={6} />}
      </group>
      {/* たかい さくらの き */}
      <group position={[-14, 0, -16.5]}>
        <mesh geometry={geo.cylinder} material={mat('#a87b5a')} position={[0, 2.2, 0]} scale={[0.4, 4.4, 0.4]} />
        <mesh geometry={geo.sphereLow} material={mat('#ffb3d1')} position={[0, 5, 0]} scale={[2, 1.6, 2]} />
        {!treeSolved && (
          <>
            <Sparkles position={[0, 5.6, 0.8]} count={10} radius={0.4} height={0.6} color="#fff3a0" />
            <EmojiSprite emoji="🪽" bg="#ffffffcc" position={[1.6, 3.5, 1]} size={0.7} />
          </>
        )}
      </group>
      {/* はなの スイッチ と かんばん */}
      <group position={[FOREST.sign.x, 0, FOREST.sign.z]}>
        <mesh geometry={geo.cylinder} material={mat('#c99b74')} position={[0, 0.5, 0]} scale={[0.08, 1, 0.08]} />
        <mesh geometry={geo.box} material={mat('#fff1c9')} position={[0, 1.1, 0]} scale={[1.2, 0.6, 0.08]} />
        {['#ff7fb6', '#ffd84d', '#6fc4ff'].map((c, i) => (
          <mesh key={c} geometry={geo.circle} material={mat(c)} position={[-0.35 + i * 0.35, 1.1, 0.05]} scale={0.12} />
        ))}
      </group>
      {/* にじの ゲート（まちへ かえる） */}
      <group position={[FOREST.portal.x, 0, FOREST.portal.z]}>
        {['#ff9ec7', '#ffd84d', '#a8ead2', '#8fd3ff', '#cdb8ff'].map((c, i) => (
          <mesh key={c} geometry={geo.torus} material={mat(c)} position={[0, 0, 0]} scale={[1.9 - i * 0.18, 1.9 - i * 0.18, 0.5]} />
        ))}
        <Sparkles count={14} radius={0.9} height={2} color="#ffffff" />
      </group>
    </>
  );
}

function Chest({ x, z, open }: { x: number; z: number; open?: boolean }) {
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={geo.box} material={mat('#ffcf8a')} position={[0, 0.3, 0]} scale={[0.8, 0.5, 0.55]} />
      <mesh geometry={geo.box} material={mat('#ff9ec7')} position={[0, 0.62, open ? -0.2 : 0]} scale={[0.84, 0.18, 0.6]} rotation={[open ? -1.2 : 0, 0, 0]} />
      <mesh geometry={geo.box} material={mat('#ffe066', { emissive: '#604a00' })} position={[0, 0.42, 0.29]} scale={[0.14, 0.18, 0.04]} />
      {!open && <Sparkles count={8} radius={0.6} height={1.2} color="#fff3a0" />}
    </group>
  );
}

export interface ForestSceneProps {
  save: SaveData;
  now: number;
  onNear: (t: Interactable | null) => void;
  onInteract: (t: Interactable) => void;
  onPickup: (id: string) => void;
  onSeen: (encounterId: string) => void;
  onMoved: () => void;
  pressedSwitches: string[];
  heroPos: { current: THREE.Vector3 };
  /** モーダル表示中など、操作を止めたい時 */
  paused: boolean;
}

export function ForestScene({ save, now, onNear, onInteract, onPickup, onSeen, onMoved, pressedSwitches, heroPos, paused }: ForestSceneProps) {
  const hero = useRef<THREE.Group>(null);
  const heroAnim = useRef<HeroAnim>('idle');
  const followers = useRef<(THREE.Group | null)[]>([]);
  const followerAnim = useRef<('idle' | 'walk')[]>(['idle', 'idle', 'idle']);
  const encounterRefs = useRef<(THREE.Group | null)[]>([]);
  const nearId = useRef<string | null>(null);
  const autoTarget = useRef<{ x: number; z: number; target?: Interactable } | null>(null);
  const moved = useRef(0);
  const seen = useRef(new Set<string>());
  const camera = useThree((s) => s.camera);

  const interactables = useMemo(() => forestInteractables(save), [save]);
  const pickups = useMemo(() => FOREST.pickups.filter((p) => isPickupAvailable(save, p.id, now)), [save, now]);
  const solved = save.forest.solvedPuzzles;
  const team = save.team.map((uid) => save.friends.find((f) => f.uid === uid)).filter((f) => !!f);

  // 最新の値を フレーム処理から読めるようにする
  const live = useRef({ interactables, pickups, solved, paused, onNear, onInteract, onPickup, onSeen, onMoved });
  live.current = { interactables, pickups, solved, paused, onNear, onInteract, onPickup, onSeen, onMoved };

  useEffect(() => {
    const p = heroPos.current;
    hero.current?.position.copy(p);
    camera.position.set(p.x, 9, p.z + 10.5);
    camera.lookAt(p.x, 0.8, p.z - 1);
    followers.current.forEach((f, i) => f?.position.set(p.x + (i - 1) * 0.8, 0, p.z + 1.2));
  }, [camera, heroPos]);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const L = live.current;
    const h = hero.current;
    if (!h) return;
    let mx = 0;
    let mz = 0;
    if (!L.paused) {
      const inp = readMove();
      if (inp.x !== 0 || inp.y !== 0) {
        autoTarget.current = null;
        mx = inp.x;
        mz = inp.y;
      } else if (autoTarget.current) {
        const t = autoTarget.current;
        const dx = t.x - h.position.x;
        const dz = t.z - h.position.z;
        const d = Math.hypot(dx, dz);
        const stopAt = t.target ? 1.6 : 0.2;
        if (d <= stopAt) {
          autoTarget.current = null;
          if (t.target) L.onInteract(t.target);
        } else {
          mx = dx / d;
          mz = dz / d;
        }
      }
    } else autoTarget.current = null;

    const mag = Math.hypot(mx, mz);
    if (mag > 0.05) {
      const step = SPEED * Math.min(1, mag) * dt;
      const nx = h.position.x + (mx / Math.max(1, mag)) * step;
      const nz = h.position.z + (mz / Math.max(1, mag)) * step;
      const r = resolveMove(nx, nz, HERO_R, L.solved);
      const dist = Math.hypot(r.x - h.position.x, r.z - h.position.z);
      // 進めない時（木にぶつかり続ける時）は 自動移動をやめる
      if (dist < step * 0.1 && autoTarget.current) autoTarget.current = null;
      h.position.x = r.x;
      h.position.z = r.z;
      h.rotation.y = Math.atan2(mx, mz);
      heroAnim.current = 'walk';
      moved.current += dist;
      if (moved.current > 4) {
        moved.current = -1e9;
        L.onMoved();
      }
    } else heroAnim.current = 'idle';
    heroPos.current.copy(h.position);

    // カメラは 主人公を やわらかく 追いかける
    const k = 1 - Math.exp(-dt * 5);
    camera.position.x += (h.position.x - camera.position.x) * k;
    camera.position.y += (9 - camera.position.y) * k;
    camera.position.z += (h.position.z + 10.5 - camera.position.z) * k;
    camera.lookAt(camera.position.x, 0.8, camera.position.z - 11.5);

    // なかまは うしろを ついてくる
    let lead = h.position;
    followers.current.forEach((f, i) => {
      if (!f) return;
      const dx = lead.x - f.position.x;
      const dz = lead.z - f.position.z;
      const d = Math.hypot(dx, dz);
      const gap = 1.1;
      if (d > gap) {
        const sp = Math.min(d - gap, SPEED * 1.2 * dt * (d > 3 ? 2 : 1));
        f.position.x += (dx / d) * sp;
        f.position.z += (dz / d) * sp;
        f.rotation.y = Math.atan2(dx, dz);
        followerAnim.current[i] = 'walk';
      } else followerAnim.current[i] = 'idle';
      lead = f.position;
    });

    // ふらふら歩く 野生の なかま
    const t = clock.elapsedTime;
    encounterRefs.current.forEach((g, i) => {
      if (!g) return;
      const e = FOREST.encounters[i];
      g.position.x = e.x + Math.sin(t * 0.5 + i) * 0.8;
      g.position.z = e.z + Math.cos(t * 0.4 + i * 2) * 0.6;
      g.rotation.y = Math.atan2(h.position.x - g.position.x, h.position.z - g.position.z);
    });

    // 落とし物は ふれると ひろう
    for (const p of L.pickups) {
      if (Math.hypot(p.x - h.position.x, p.z - h.position.z) < 0.9) L.onPickup(p.id);
    }
    // 近くの しらべられる物
    let best: Interactable | null = null;
    let bestD = NEAR;
    for (const it of L.interactables) {
      const d = Math.hypot(it.x - h.position.x, it.z - h.position.z);
      if (d < bestD) {
        bestD = d;
        best = it;
      }
      if (it.kind === 'encounter' && d < 5 && !seen.current.has(it.id)) {
        seen.current.add(it.id);
        L.onSeen(it.id);
      }
    }
    if ((best?.id ?? null) !== nearId.current) {
      nearId.current = best?.id ?? null;
      L.onNear(best);
    }
  });

  const tapGround = (e: ThreeEvent<PointerEvent>) => {
    if (paused) return;
    autoTarget.current = { x: e.point.x, z: e.point.z };
  };
  const tapTarget = (it: Interactable) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (paused) return;
    autoTarget.current = { x: it.x, z: it.z, target: it };
  };
  const byId = (id: string) => interactables.find((i) => i.id === id);

  return (
    <>
      <color attach="background" args={['#ffeef6']} />
      <fog attach="fog" args={['#ffeef6', 22, 48]} />
      <hemisphereLight args={['#fff6fb', '#b8e6b0', 2.2]} />
      <directionalLight position={[6, 12, 8]} intensity={1.6} color="#fff4e0" />
      <Scenery solved={solved} onGround={tapGround} />
      <Petals target={heroPos} />

      {FOREST.chests.map((c) => {
        const visible = !('lockedBy' in c && c.lockedBy) || solved.includes(c.lockedBy);
        if (!visible) return null;
        const it = byId(c.id);
        return (
          <group key={c.id} onPointerDown={it ? tapTarget(it) : undefined}>
            <Chest x={c.x} z={c.z} open={save.forest.openedChests.includes(c.id)} />
          </group>
        );
      })}
      {FOREST.puzzles.filter((p) => p.ability && !solved.includes(p.id)).map((p) => {
        const it = byId(p.id);
        return (
          <mesh key={p.id} geometry={geo.sphereLow} material={mat('#ffffff', { transparent: 0 })} position={[p.x, 1, p.z]} scale={1.4} onPointerDown={it ? tapTarget(it) : undefined} />
        );
      })}
      {FOREST.switches.map((sw) => {
        const on = solved.includes('p_switch') || pressedSwitches.includes(sw.id);
        const it = byId(sw.id);
        return (
          <group key={sw.id} position={[sw.x, 0, sw.z]} onPointerDown={it ? tapTarget(it) : undefined}>
            <mesh geometry={geo.cylinder} material={mat(sw.color, { emissive: on ? '#806040' : undefined })} position={[0, on ? 0.06 : 0.15, 0]} scale={[0.7, on ? 0.12 : 0.3, 0.7]} />
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh key={i} geometry={geo.sphereLow} material={mat(sw.color)} position={[Math.cos(i * 1.256) * 0.85, 0.1, Math.sin(i * 1.256) * 0.85]} scale={0.22} />
            ))}
            {on && <Sparkles count={8} radius={0.6} height={1} color={sw.color} />}
          </group>
        );
      })}
      {FOREST.encounters.map((e, i) =>
        save.forest.befriended.includes(e.id) ? null : (
          <group key={e.id} ref={(g) => { encounterRefs.current[i] = g; }} position={[e.x, 0, e.z]} onPointerDown={byId(e.id) ? tapTarget(byId(e.id)!) : undefined}>
            <Creature look={getSpecies(e.species).look} anim="idle" />
            <EmojiSprite emoji={save.dex[e.species] ? '💗' : '❔'} bg="#ffffffcc" position={[0, 1.8, 0]} size={0.55} />
          </group>
        ),
      )}
      {pickups.map((p) => (
        <group key={p.id} position={[p.x, 0.6, p.z]}>
          <EmojiSprite emoji={getItem(p.item)?.icon ?? '✨'} size={0.6} />
          <Sparkles count={6} radius={0.35} height={0.8} position={[0, -0.5, 0]} color="#ffffff" size={0.12} />
        </group>
      ))}

      <group ref={hero}>
        <Heroine look={save.player} equipped={save.equipped} princess={save.princess} animRef={heroAnim} />
      </group>
      {team.map((f, i) => (
        <group key={f.uid} ref={(g) => { followers.current[i] = g; }}>
          <FollowerCreature speciesId={f.speciesId} animRef={followerAnim} index={i} />
        </group>
      ))}
    </>
  );
}

function FollowerCreature({ speciesId, animRef, index }: { speciesId: string; animRef: { current: ('idle' | 'walk')[] }; index: number }) {
  // アニメの種類は ref から読み、ここでは再描画しない
  const anim = useRef<CreatureAnim>('idle');
  useFrame(() => {
    anim.current = animRef.current[index];
  });
  return (
    <group scale={0.85}>
      <Creature look={getSpecies(speciesId).look} animRef={anim} />
    </group>
  );
}
