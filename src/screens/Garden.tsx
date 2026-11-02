import { useState } from 'react';
import { SEEDS, getSeed, itemIcon, itemName } from '../game/data/items';
import { getSpecies } from '../game/data/species';
import { displayName, getFriend } from '../game/logic/friends';
import { HELPER_INTERVAL, HELPER_MAX_FINDS, collectHelpers, harvest, helperFinds, plant, plotProgress, plotStatus } from '../game/logic/life';
import { formatRemain } from '../game/logic/time';
import { useGame } from '../state/store';
import { CreatureIcon, Modal, RewardList, Screen, useNow, useSave } from '../ui/common';

const STATUS_TEXT = { empty: 'からっぽ', seed: 'たねを うえたよ', growing: 'そだっているよ', ready: 'さいたよ！' };
const STATUS_ICON = { empty: '🟫', seed: '🌱', growing: '🌿', ready: '🌸' };

export function GardenScreen() {
  const save = useSave();
  const apply = useGame((s) => s.apply);
  const tutorial = useGame((s) => s.tutorial);
  const go = useGame((s) => s.go);
  const now = useNow();
  const [choose, setChoose] = useState<number | null>(null);
  const [got, setGot] = useState<Record<string, number> | null>(null);
  const seeds = SEEDS.filter((s) => (save.items[s.id] ?? 0) > 0);

  return (
    <Screen title="おはなばたけ">
      <p className="note">たねを うえると、じかんが たつと はなが さくよ。ゲームを とじていても そだつよ。</p>
      <div className="grid c3">
        {save.garden.map((p, i) => {
          const st = plotStatus(save, i, now);
          const seed = p.seedId ? getSeed(p.seedId) : undefined;
          return (
            <div key={i} className="plot-card">
              <span className="ic">{st === 'ready' && seed ? '🌸' : STATUS_ICON[st]}</span>
              <div style={{ fontSize: '.8rem', fontWeight: 700 }}>{seed ? seed.name.replace('の たね', '') : STATUS_TEXT[st]}</div>
              {seed && st !== 'ready' && (
                <>
                  <div className="bar"><i style={{ width: `${plotProgress(save, i, now) * 100}%` }} /></div>
                  <span className="muted" style={{ fontSize: '.75rem' }}>{STATUS_TEXT[st]}・あと {formatRemain(p.readyAt - now)}</span>
                </>
              )}
              {st === 'empty' && <button className="btn small primary" onClick={() => setChoose(i)}>うえる</button>}
              {st === 'ready' && (
                <button
                  className="btn small primary"
                  onClick={() => {
                    const r = apply((s, n) => harvest(s, i, n), { quiet: true, sound: 'chest' });
                    if (r?.ok) setGot(r.data as Record<string, number>);
                  }}
                >
                  しゅうかく
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="section-title">🔍 まちの おてつだい</div>
      <div className="card">
        {save.town.helpers.length === 0 ? (
          <p className="note" style={{ margin: 0 }}>
            なかまの ページで「まちで そざいさがしを たのむ」を おすと、{HELPER_INTERVAL / 60000}ふん ごとに そざいを みつけてくれるよ（{HELPER_MAX_FINDS}こ まで たまる）。
          </p>
        ) : (
          <>
            {save.town.helpers.map((h) => {
              const f = getFriend(save, h.uid);
              if (!f) return null;
              const n = helperFinds(h.startedAt, now);
              return (
                <div key={h.uid} className="row" style={{ marginBottom: 6 }}>
                  <CreatureIcon look={getSpecies(f.speciesId).look} size={40} />
                  <span className="grow">{displayName(f)}</span>
                  <span className="tag">{n >= HELPER_MAX_FINDS ? 'いっぱい！' : `みつけた ${n}こ`}</span>
                </div>
              );
            })}
            <button
              className="btn primary block"
              onClick={() => {
                const r = apply((s, n) => collectHelpers(s, n, Math.random), { quiet: false, sound: 'chest' });
                if (r?.ok) setGot(r.data as Record<string, number>);
              }}
            >
              🎁 うけとる
            </button>
          </>
        )}
      </div>

      {choose !== null && (
        <Modal title="どの たねを うえる？" onClose={() => setChoose(null)} closeLabel="やめる">
          {seeds.length === 0 && (
            <p className="center note">
              たねを もっていないよ。
              <br />
              <button className="btn small" style={{ marginTop: 8 }} onClick={() => go('shop', 'seed')}>🛍️ おみせで かう</button>
            </p>
          )}
          <div className="grid list">
            {seeds.map((s) => (
              <button
                key={s.id}
                className="item-tile"
                style={{ border: 0, textAlign: 'left' }}
                onClick={() => {
                  const idx = choose;
                  setChoose(null);
                  const r = apply((st, n) => plant(st, idx, s.id, n), { sound: 'sparkle' });
                  if (r?.ok) tutorial('planted');
                }}
              >
                <span className="ic" style={{ color: s.color }}>🌱</span>
                <div className="grow">
                  <div className="n">{s.name} ×{save.items[s.id]}</div>
                  <div className="muted" style={{ fontSize: '.78rem' }}>
                    {s.growMinutes}ふん ・ とれる：{Object.entries(s.harvest).map(([k, v]) => `${itemIcon(k)}${itemName(k)}${v}`).join(' ')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {got && (
        <Modal title="てに いれた！" onClose={() => setGot(null)} closeLabel="やったね">
          <div className="celebrate">🌸</div>
          <RewardList reward={got} />
        </Modal>
      )}
    </Screen>
  );
}
