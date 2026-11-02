import { useEffect, useRef, useState } from 'react';

/** 移動の入力。React の state にせず、3D のフレーム処理から直接読む（毎フレームの再描画を防ぐ） */
export const moveInput = { x: 0, y: 0, joystick: false, keys: new Set<string>() };

export function readMove(): { x: number; y: number } {
  if (moveInput.joystick) return { x: moveInput.x, y: moveInput.y };
  const k = moveInput.keys;
  let x = 0;
  let y = 0;
  if (k.has('ArrowLeft') || k.has('a')) x -= 1;
  if (k.has('ArrowRight') || k.has('d')) x += 1;
  if (k.has('ArrowUp') || k.has('w')) y -= 1;
  if (k.has('ArrowDown') || k.has('s')) y += 1;
  const len = Math.hypot(x, y);
  return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
}

/** PC でも試せるように キーボード（矢印 / WASD）も受け付ける */
export function useKeyboard(onAction?: () => void): void {
  useEffect(() => {
    const norm = (k: string) => (k.length === 1 ? k.toLowerCase() : k);
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === ' ' || e.key === 'Enter') {
        onAction?.();
        e.preventDefault();
        return;
      }
      moveInput.keys.add(norm(e.key));
    };
    const up = (e: KeyboardEvent) => moveInput.keys.delete(norm(e.key));
    const blur = () => moveInput.keys.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      moveInput.keys.clear();
    };
  }, [onAction]);
}

const RADIUS = 40;
/** スティックの まんなかの ふだんの 位置（ゾーンの 左下から） */
const HOME = { x: 64, y: 64 };

/**
 * 左下の ひろい ばしょ どこを さわっても、そこに スティックが でる（ちいさい 子でも はずしにくい）。
 * ゆびを はなすと もとの 位置に もどる。
 */
export function Joystick() {
  const zone = useRef<HTMLDivElement>(null);
  const [st, setSt] = useState({ cx: HOME.x, cy: HOME.y, x: 0, y: 0, on: false });
  const pointer = useRef<number | null>(null);
  const center = useRef({ x: 0, y: 0 });

  useEffect(
    () => () => {
      moveInput.joystick = false;
      moveInput.x = moveInput.y = 0;
    },
    [],
  );

  function update(clientX: number, clientY: number) {
    let dx = clientX - center.current.x;
    let dy = clientY - center.current.y;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    moveInput.x = dx / RADIUS;
    moveInput.y = dy / RADIUS;
    moveInput.joystick = true;
    setSt((p) => ({ ...p, x: dx, y: dy, on: true }));
  }
  function end() {
    pointer.current = null;
    moveInput.joystick = false;
    moveInput.x = moveInput.y = 0;
    setSt({ cx: HOME.x, cy: HOME.y, x: 0, y: 0, on: false });
  }

  return (
    <div
      className="joy-zone"
      ref={zone}
      aria-label="いどう スティック"
      onPointerDown={(e) => {
        const el = zone.current;
        if (!el || pointer.current !== null) return;
        e.preventDefault();
        const r = el.getBoundingClientRect();
        // ふちに ちかすぎる 時は すこし 内がわに ずらす
        const m = RADIUS + 10;
        const cx = Math.min(Math.max(e.clientX - r.left, m), r.width - m);
        const cy = Math.min(Math.max(r.bottom - e.clientY, m), r.height - m);
        center.current = { x: r.left + cx, y: r.bottom - cy };
        pointer.current = e.pointerId;
        try {
          el.setPointerCapture?.(e.pointerId);
        } catch {
          // つかめない ポインター（古い端末など）でも そのまま うごかせるように する
        }
        setSt({ cx, cy, x: 0, y: 0, on: true });
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pointer.current === e.pointerId) update(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    >
      <div className={`joystick${st.on ? ' on' : ''}`} style={{ left: st.cx, bottom: st.cy }}>
        <div className={`joystick-knob${st.on ? ' on' : ''}`} style={{ transform: `translate(${st.x}px, ${st.y}px)` }} />
      </div>
    </div>
  );
}
