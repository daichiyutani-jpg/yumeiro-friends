import { useEffect, useRef, useState } from 'react';
import { SAVE_VERSION, clone } from '../game/logic/core';
import { migrate } from '../game/logic/migrate';
import type { SaveData } from '../game/types';
import { applyUpdate, checkOfflineStatus, usePwa } from '../pwa';
import { useGame } from '../state/store';
import { Confirm, Screen, useOnline, useSave } from '../ui/common';

function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button className={`choice${on ? ' on' : ''}`} style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }} onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span>{label}</span>
      <b>{on ? 'オン' : 'オフ'}</b>
    </button>
  );
}

export function SettingsScreen() {
  const save = useSave();
  const patch = useGame((s) => s.patch);
  const flush = useGame((s) => s.flush);
  const resetAll = useGame((s) => s.resetAll);
  const importSave = useGame((s) => s.importSave);
  const toast = useGame((s) => s.toast);
  const lastSavedAt = useGame((s) => s.lastSavedAt);
  const saveError = useGame((s) => s.saveError);
  const pwa = usePwa();
  const online = useOnline();
  const [reset, setReset] = useState(0);
  const [pendingImport, setPendingImport] = useState<SaveData | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    void checkOfflineStatus();
  }, []);

  const setSetting = (k: keyof SaveData['settings'], v: boolean) =>
    patch((s) => {
      const c = clone(s);
      c.settings[k] = v;
      return c;
    });

  const exportSave = () => {
    const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `yumeiro-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <Screen title="せってい">
      <div className="section-title">🎛️ あそびかた</div>
      <div className="grid list">
        <Toggle on={save.settings.sound} label="🔊 こうかおん" onChange={(v) => setSetting('sound', v)} />
        <Toggle on={save.settings.bigText} label="🔠 おおきい もじ" onChange={(v) => setSetting('bigText', v)} />
        <Toggle on={save.settings.reduceMotion} label="🐢 うごきを へらす（おうちの なかまが うごかない）" onChange={(v) => setSetting('reduceMotion', v)} />
        <button
          className="btn block"
          onClick={() =>
            patch((s) => {
              const c = clone(s);
              c.tutorial = { step: 1, done: false };
              return c;
            })
          }
        >
          🧚 チュートリアルを もういちど みる
        </button>
      </div>

      <div className="section-title">💾 セーブ</div>
      <div className="card" style={{ lineHeight: 1.8 }}>
        <div>この たんまつの なかに じどうで セーブ しているよ（IndexedDB）。</div>
        <div className="muted" style={{ fontSize: '.85rem' }}>
          さいごの セーブ：{lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString('ja-JP') : 'まだ'} ・ データの バージョン {SAVE_VERSION}
        </div>
        {saveError && <div className="tag warn">⚠️ {saveError}</div>}
        <div className="grid c2" style={{ marginTop: 8 }}>
          <button className="btn" onClick={async () => { await flush(); if (!useGame.getState().saveError) toast('セーブ したよ', 'good'); }}>💾 いま セーブ</button>
          <button className="btn" onClick={exportSave}>📤 ファイルに ほぞん</button>
        </div>
        <button className="btn block" style={{ marginTop: 8 }} onClick={() => fileRef.current?.click()}>📥 ファイルから よみこむ</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            try {
              setPendingImport(migrate(JSON.parse(await file.text())));
            } catch (err) {
              toast(`よみこめませんでした：${err instanceof Error ? err.message : err}`, 'warn');
            }
          }}
        />
        <p className="note">べつの たんまつへ うつす ときや、おうちの ひとの バックアップ用 です。</p>
      </div>

      <div className="section-title">📶 オフライン</div>
      <div className="card" style={{ lineHeight: 1.8 }}>
        <div>
          <span className="online-dot" style={{ background: online ? '#3aa676' : '#c0a0b0' }} />
          いまは {online ? 'オンライン' : 'オフライン'}
        </div>
        {pwa.supported ? (
          <>
            <div>{pwa.ready ? '✔ オフラインでも あそべる じゅんびが できています' : '… オフラインの じゅんびちゅう'}{pwa.total ? `（${pwa.cached}/${pwa.total} ファイル）` : ''}</div>
            {pwa.updateWaiting && <button className="btn primary block" onClick={applyUpdate}>✨ あたらしい バージョンに する</button>}
          </>
        ) : (
          <div className="muted">かいはつよう の がめんでは オフライン きのうは うごきません（ほんばん ビルドで うごきます）。</div>
        )}
        <p className="note">ホームがめんに ついか すると、アプリの ように ひらけるよ（iPhone：きょうゆう →「ホーム画面に追加」／ Android：メニュー →「アプリをインストール」）。</p>
      </div>

      <div className="section-title">🧹 データの しょきか（テスト用）</div>
      <button className="btn danger block" onClick={() => setReset(1)}>セーブデータを ぜんぶ けす</button>
      <p className="note">コイン・なかま・おうち など すべて きえて、さいしょから に なります。</p>

      <div className="section-title">ℹ️ このゲームについて</div>
      <div className="card note" style={{ margin: 0 }}>
        ゆめいろフレンズ ためしばん 0.1。かきん・こうこく は ありません。キャラクター・え・おと は すべて この ゲームの ために つくった オリジナル です。
      </div>

      {reset === 1 && (
        <Confirm title="ほんとうに けす？" text="けした データは もとに もどせません。" okLabel="つぎへ" onCancel={() => setReset(0)} onOk={() => setReset(2)} />
      )}
      {reset === 2 && (
        <Confirm
          title="さいごの かくにん"
          text={<>「{save.player.name}」の セーブデータを けして、タイトルに もどります。</>}
          okLabel="けす"
          onCancel={() => setReset(0)}
          onOk={async () => {
            setReset(0);
            await resetAll();
          }}
        />
      )}
      {pendingImport && (
        <Confirm
          title="セーブデータを よみこむ？"
          text={<>「{pendingImport.player.name}」の データで、いまの データ（{save.player.name}）を うわがき します。</>}
          okLabel="よみこむ"
          onCancel={() => setPendingImport(null)}
          onOk={async () => {
            const d = pendingImport;
            setPendingImport(null);
            await importSave(d);
            toast('よみこみ ました', 'good');
          }}
        />
      )}
    </Screen>
  );
}
