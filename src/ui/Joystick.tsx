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

const RADIUS = 52;

export function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0, on: false });
  const pointer = useRef<number | null>(null);

  useEffect(
    () => () => {
      moveInput.joystick = false;
      moveInput.x = moveInput.y = 0;
    },
    [],
  );

  function update(clientX: number, clientY: number) {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let dx = clientX - (r.left + r.width / 2);
    let dy = clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    moveInput.x = dx / RADIUS;
    moveInput.y = dy / RADIUS;
    moveInput.joystick = true;
    setKnob({ x: dx, y: dy, on: true });
  }
  function end() {
    pointer.current = null;
    moveInput.joystick = false;
    moveInput.x = moveInput.y = 0;
    setKnob({ x: 0, y: 0, on: false });
  }

  return (
    <div
      className="joystick"
      ref={base}
      aria-label="いどう スティック"
      onPointerDown={(e) => {
        pointer.current = e.pointerId;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pointer.current === e.pointerId) update(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    >
      <div className={`joystick-knob${knob.on ? ' on' : ''}`} style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      <span className="joystick-label">いどう</span>
    </div>
  );
}
