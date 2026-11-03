import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { itemCount } from '../game/logic/core';
import { itemIcon, itemName } from '../game/data/items';
import type { CreatureLook, SaveData } from '../game/types';
import { gameNow, useGame, type ScreenId } from '../state/store';

/** 1秒ごとに ゲーム内時刻を更新する（タイマー表示用） */
export function useNow(intervalMs = 1000): number {
  const save = useGame((s) => s.save);
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return save ? gameNow(save) : Date.now();
}

export function useSave(): SaveData {
  const save = useGame((s) => s.save);
  if (!save) throw new Error('save not loaded');
  return save;
}

/** ふつうの 画面の 枠。side を わたすと 左に 3D などを 出して 2れつ に なる。中身は スクロールせず 1画面に おさめる */
export function Screen({ title, back = 'home', children, right, onBack, side }: { title: string; back?: ScreenId | null; children: ReactNode; right?: ReactNode; onBack?: () => void; side?: ReactNode }) {
  const go = useGame((s) => s.go);
  const coins = useGame((s) => s.save?.coins ?? 0);
  return (
    <div className="screen">
      <div className="topbar">
        {back !== null ? (
          <button className="btn small back" onClick={() => (onBack ? onBack() : go(back))} aria-label="もどる">
            ◀ もどる
          </button>
        ) : (
          <span className="back" />
        )}
        <h1>{title}</h1>
        {right ?? <span className="coins">🪙 {coins}</span>}
      </div>
      {side ? (
        <div className="screen-main">
          <div className="side">{side}</div>
          <div className="body">{children}</div>
        </div>
      ) : (
        <div className="body">{children}</div>
      )}
    </div>
  );
}

/**
 * スクロールの かわりに ページで みせる 一覧。のこりの たかさに はいる ぶんだけ ならべ、◀ ▶ で めくる。
 * 1ページの 数は、じっさいに ならべた 列の数 × 入る行の数（いちばん たかい マスで はかる）で きめる。
 */
export function Paged({ items, className = 'grid list', resetKey }: { items: ReactNode[]; className?: string; resetKey?: unknown }) {
  const view = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const itemH = useRef(0);
  const [per, setPer] = useState(items.length || 1);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(0);
  useEffect(() => setPage(0), [resetKey]);
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const ro = new ResizeObserver(() => setSize(v.clientHeight * 10000 + v.clientWidth));
    ro.observe(v);
    return () => ro.disconnect();
  }, []);
  useLayoutEffect(() => {
    const v = view.current;
    const g = grid.current;
    if (!v || !g || g.children.length === 0) return;
    const cs = getComputedStyle(g);
    const cols = Math.max(1, cs.gridTemplateColumns.split(' ').filter(Boolean).length);
    const gap = parseFloat(cs.rowGap) || 0;
    for (const c of Array.from(g.children)) itemH.current = Math.max(itemH.current, (c as HTMLElement).offsetHeight);
    const vs = getComputedStyle(v);
    const inner = v.clientHeight - (parseFloat(vs.paddingTop) || 0) - (parseFloat(vs.paddingBottom) || 0);
    const rows = Math.max(1, Math.floor((inner + gap) / (itemH.current + gap)));
    const next = Math.max(1, cols * rows);
    if (next !== per) setPer(next);
  });
  useEffect(() => {
    itemH.current = 0;
  }, [resetKey, size]);
  const pages = Math.max(1, Math.ceil(items.length / per));
  const p = Math.min(page, pages - 1);
  return (
    <div className="paged">
      <div className="paged-view" ref={view}>
        <div className={className} ref={grid}>
          {items.slice(p * per, p * per + per)}
        </div>
      </div>
      {pages > 1 && (
        <div className="pager">
          <button className="btn small" disabled={p === 0} onClick={() => setPage(p - 1)} aria-label="まえの ページ">◀</button>
          <span>{p + 1} / {pages}</span>
          <button className="btn small" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} aria-label="つぎの ページ">▶</button>
        </div>
      )}
    </div>
  );
}

/** wide: よこに ひろい モーダル（左右 2れつの 中身を いれる 時） */
export function Modal({ title, children, onClose, closeLabel = 'とじる', wide }: { title?: string; children: ReactNode; onClose?: () => void; closeLabel?: string; wide?: boolean }) {
  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true">
        {title && <h2>{title}</h2>}
        {children}
        {onClose && (
          <div className="actions">
            <button className="btn block" onClick={onClose}>
              {closeLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** アイテムを使う前の確認 */
export function Confirm({ title, text, cost, okLabel = 'はい', onOk, onCancel }: { title: string; text?: ReactNode; cost?: Record<string, number>; okLabel?: string; onOk: () => void; onCancel: () => void }) {
  const save = useGame((s) => s.save);
  return (
    <Modal title={title}>
      {text && <p className="center" style={{ lineHeight: 1.7 }}>{text}</p>}
      {cost && save && Object.keys(cost).length > 0 && (
        <>
          <p className="center muted" style={{ margin: '4px 0' }}>つかう もの</p>
          <CostList cost={cost} save={save} />
        </>
      )}
      <div className="actions">
        <button className="btn primary block" onClick={onOk}>
          {okLabel}
        </button>
        <button className="btn block" onClick={onCancel}>
          やめる
        </button>
      </div>
    </Modal>
  );
}

/** 必要な物の一覧。足りない物は「たりない」と文字でも出す（色だけに頼らない） */
export function CostList({ cost, save }: { cost: Record<string, number>; save: SaveData }) {
  return (
    <div className="reward-list">
      {Object.entries(cost).map(([id, n]) => {
        const have = itemCount(save, id);
        const short = have < n;
        return (
          <span key={id} className={`tag ${short ? 'warn' : 'ok'}`} title={itemName(id)}>
            {itemIcon(id)} {itemName(id)} {n}
            <span style={{ fontWeight: 400 }}>（もってる {have}{short ? '・たりない' : ''}）</span>
          </span>
        );
      })}
    </div>
  );
}

export function RewardList({ reward }: { reward: Record<string, number> }) {
  return (
    <div className="reward-list">
      {Object.entries(reward).map(([id, n]) => (
        <span key={id} className="reward">
          {itemIcon(id)} {itemName(id)} ×{n}
        </span>
      ))}
    </div>
  );
}

const EAR_PATHS: Record<CreatureLook['ears'], (c: string, a: string) => ReactNode> = {
  long: (c, a) => (
    <>
      <ellipse cx="36" cy="18" rx="8" ry="20" fill={c} transform="rotate(-12 36 18)" />
      <ellipse cx="64" cy="18" rx="8" ry="20" fill={c} transform="rotate(12 64 18)" />
      <ellipse cx="36" cy="18" rx="4" ry="14" fill={a} transform="rotate(-12 36 18)" />
      <ellipse cx="64" cy="18" rx="4" ry="14" fill={a} transform="rotate(12 64 18)" />
    </>
  ),
  pointy: (c, a) => (
    <>
      <path d="M22 40 L28 8 L44 30 Z" fill={c} />
      <path d="M78 40 L72 8 L56 30 Z" fill={c} />
      <path d="M27 34 L30 16 L39 30 Z" fill={a} />
      <path d="M73 34 L70 16 L61 30 Z" fill={a} />
    </>
  ),
  round: (c) => (
    <>
      <circle cx="24" cy="28" r="11" fill={c} />
      <circle cx="76" cy="28" r="11" fill={c} />
    </>
  ),
  tiny: (c) => (
    <>
      <circle cx="26" cy="32" r="6" fill={c} />
      <circle cx="74" cy="32" r="6" fill={c} />
    </>
  ),
  tuft: (c) => (
    <>
      <path d="M24 36 L22 12 L38 30 Z" fill={c} />
      <path d="M76 36 L78 12 L62 30 Z" fill={c} />
    </>
  ),
  antler: (_c, a) => (
    <>
      <path d="M36 28 L30 8 M32 16 L24 12 M64 28 L70 8 M68 16 L76 12" stroke="#c99b74" strokeWidth="4" strokeLinecap="round" />
      <circle cx="30" cy="8" r="4" fill={a} />
      <circle cx="70" cy="8" r="4" fill={a} />
    </>
  ),
  none: () => null,
};

const MOTIF_ICON: Record<CreatureLook['motif'], string> = {
  flower: '🌸', star: '⭐', candy: '🍬', bubble: '🫧', cloud: '☁️', gem: '💎', leaf: '🍃', moon: '🌙', ribbon: '🎀', rainbow: '🌈', snow: '❄️', magic: '🪄',
};

/** 一覧や図鑑で使う 軽い2Dアイコン（3Dを たくさん描かないため） */
export function CreatureIcon({ look, size = 64, silhouette = false }: { look: CreatureLook; size?: number; silhouette?: boolean }) {
  const c = silhouette ? '#cfc2dd' : look.body;
  const a = silhouette ? '#cfc2dd' : look.accent;
  const b = silhouette ? '#cfc2dd' : look.belly;
  // 進化した姿は せが のびて（あたまが うえ）、みみが おおきく、えりかざり・しっぽ・ひたいの しるしが つく
  const evo = look.stage === 2;
  const hy = evo ? 46 : 52;
  return (
    <svg width={size} height={size} viewBox={evo ? '-6 -14 112 114' : '0 0 100 100'} aria-hidden="true">
      {evo && look.extra === 'wings' && !silhouette && (
        <>
          <path d="M30 70 Q2 46 6 30 Q22 44 34 60 Z" fill="#fff" stroke={a} strokeWidth="2" />
          <path d="M70 70 Q98 46 94 30 Q78 44 66 60 Z" fill="#fff" stroke={a} strokeWidth="2" />
        </>
      )}
      {evo && look.tail !== 'none' && look.tail !== 'spiky' && (
        <>
          <circle cx="80" cy="78" r="10" fill={c} />
          <circle cx="88" cy="64" r="8" fill={b} />
          <circle cx="90" cy="51" r="6" fill={a} />
        </>
      )}
      <g transform={evo ? `translate(50 ${hy - 10}) scale(1.25) translate(-50 -42)` : `translate(0 ${hy - 52})`}>{EAR_PATHS[look.ears](c, a)}</g>
      {evo && look.ears === 'none' && <path d={`M38 ${hy - 22} L42 ${hy - 40} L47 ${hy - 26} L50 ${hy - 46} L53 ${hy - 26} L58 ${hy - 40} L62 ${hy - 22} Z`} fill={a} />}
      <ellipse cx="50" cy={evo ? 80 : 82} rx={evo ? 24 : 26} ry={evo ? 19 : 16} fill={c} />
      {evo && !silhouette && [-3, -2, -1, 0, 1, 2, 3].map((i) => <circle key={i} cx={50 + i * 8.5} cy={71 + Math.abs(i) * 1.5} r="6.5" fill={i % 2 ? b : a} />)}
      <circle cx="50" cy={hy} r="30" fill={c} />
      {!silhouette && (
        <g transform={`translate(0 ${hy - 52})`}>
          <ellipse cx="50" cy="62" rx="15" ry="10" fill={b} />
          <ellipse cx="39" cy="52" rx="4" ry="5.5" fill="#3a2a4a" />
          <ellipse cx="61" cy="52" rx="4" ry="5.5" fill="#3a2a4a" />
          {evo && (
            <>
              <ellipse cx="39" cy="53.5" rx="2.6" ry="3.2" fill={a} />
              <ellipse cx="61" cy="53.5" rx="2.6" ry="3.2" fill={a} />
            </>
          )}
          <circle cx="40.5" cy="50" r="1.6" fill="#fff" />
          <circle cx="62.5" cy="50" r="1.6" fill="#fff" />
          <ellipse cx="31" cy="61" rx="5" ry="3" fill="#ffa5c4" />
          <ellipse cx="69" cy="61" rx="5" ry="3" fill="#ffa5c4" />
          <ellipse cx="50" cy="59" rx="2.5" ry="1.8" fill="#7a4a5a" />
          {evo && <path d="M50 30 L53 37 L50 44 L47 37 Z" fill={a} stroke="#fff" strokeWidth="1" />}
          <text x="70" y="34" fontSize="18">{MOTIF_ICON[look.motif]}</text>
          {look.extra === 'crown' && <text x={evo ? 36 : 38} y="26" fontSize={evo ? 24 : 20}>👑</text>}
          {look.extra === 'halo' && <ellipse cx="50" cy={evo ? 14 : 18} rx={evo ? 20 : 16} ry="4.5" fill="none" stroke="#ffe066" strokeWidth={evo ? 4 : 3} />}
          {look.extra === 'wings' && !evo && <text x="2" y="70" fontSize="18">🪽</text>}
        </g>
      )}
      {!silhouette && look.extra === 'cape' && <path d="M26 74 Q50 98 74 74 L70 92 Q50 100 30 92 Z" fill={a} opacity=".8" />}
      {evo && !silhouette && (
        <>
          <text x="2" y="22" fontSize="13">✨</text>
          <text x="2" y="96" fontSize="11">✨</text>
        </>
      )}
      {silhouette && <text x="42" y="60" fontSize="20" fill="#fff" fontWeight="bold">?</text>}
    </svg>
  );
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}
