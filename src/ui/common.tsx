import { useEffect, useState, type ReactNode } from 'react';
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

export function Screen({ title, back = 'home', children, right, onBack }: { title: string; back?: ScreenId | null; children: ReactNode; right?: ReactNode; onBack?: () => void }) {
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
      <div className="body">{children}</div>
    </div>
  );
}

export function Modal({ title, children, onClose, closeLabel = 'とじる' }: { title?: string; children: ReactNode; onClose?: () => void; closeLabel?: string }) {
  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true">
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
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      {EAR_PATHS[look.ears](c, a)}
      <ellipse cx="50" cy="82" rx="26" ry="16" fill={c} />
      <circle cx="50" cy="52" r="30" fill={c} />
      {!silhouette && (
        <>
          <ellipse cx="50" cy="62" rx="15" ry="10" fill={b} />
          <ellipse cx="39" cy="52" rx="4" ry="5.5" fill="#3a2a4a" />
          <ellipse cx="61" cy="52" rx="4" ry="5.5" fill="#3a2a4a" />
          <circle cx="40.5" cy="50" r="1.6" fill="#fff" />
          <circle cx="62.5" cy="50" r="1.6" fill="#fff" />
          <ellipse cx="31" cy="61" rx="5" ry="3" fill="#ffa5c4" />
          <ellipse cx="69" cy="61" rx="5" ry="3" fill="#ffa5c4" />
          <ellipse cx="50" cy="59" rx="2.5" ry="1.8" fill="#7a4a5a" />
          <text x="70" y="34" fontSize="18">{MOTIF_ICON[look.motif]}</text>
          {look.extra === 'crown' && <text x="38" y="26" fontSize="20">👑</text>}
          {look.extra === 'halo' && <ellipse cx="50" cy="18" rx="16" ry="4" fill="none" stroke="#ffe066" strokeWidth="3" />}
          {look.extra === 'wings' && <text x="2" y="70" fontSize="18">🪽</text>}
          {look.extra === 'cape' && <path d="M26 74 Q50 98 74 74 L70 92 Q50 100 30 92 Z" fill={a} opacity=".8" />}
        </>
      )}
      {silhouette && <text x="42" y="60" fontSize="20" fill="#fff" fontWeight="bold">?</text>}
    </svg>
  );
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  const dismiss = useGame((s) => s.dismissToast);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismiss(t.id)}>
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
