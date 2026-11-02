import { useMemo, useState } from 'react';
import { MATERIALS, itemIcon, itemName } from '../game/data/items';
import { SAMPLE_FRIENDS, type SampleFriend } from '../game/data/sampleFriends';
import { Stage } from '../three/Stage';
import { RoomScene } from '../three/RoomScene';
import { Modal, Paged, Screen, useOnline, useSave } from '../ui/common';

type Tab = 'list' | 'visit' | 'trade' | 'qr';

function MockBanner() {
  return (
    <div className="mock-banner" role="note">
      🧪 ここは「おためし」の ばしょです。まだ ほんとうの ともだちとは つながりません。みほんの ともだちで あそべます。
    </div>
  );
}

/** みほんの QR もよう（ほんものの QRコードでは ない） */
function FakeQr({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let h = 0;
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return Array.from({ length: 21 * 21 }, (_, i) => {
      const x = i % 21;
      const y = Math.floor(i / 21);
      const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      if (finder) {
        const fx = x > 13 ? x - 14 : x;
        const fy = y > 13 ? y - 14 : y;
        return fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
      }
      h = (h * 1103515245 + 12345) >>> 0;
      return (h >> 16) % 2 === 0;
    });
  }, [seed]);
  return (
    <div className="qr" aria-label="みほんの QRコード">
      {cells.map((on, i) => (
        <i key={i} style={{ background: on ? '#5a3f6b' : 'transparent' }} />
      ))}
    </div>
  );
}

export function SocialScreen() {
  const save = useSave();
  const online = useOnline();
  const [tab, setTab] = useState<Tab>('list');
  const [visit, setVisit] = useState<SampleFriend>(SAMPLE_FRIENDS[0]);
  const [partner, setPartner] = useState<SampleFriend>(SAMPLE_FRIENDS[0]);
  const [give, setGive] = useState<string | null>(null);
  const [get, setGet] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const myMaterials = MATERIALS.filter((m) => (save.items[m.id] ?? 0) > 0);

  return (
    <Screen title="ともだち（おためし）">
      <MockBanner />
      <p className="status-line" style={{ textAlign: 'left', margin: '4px 4px' }}>
        <span className="online-dot" style={{ background: online ? '#3aa676' : '#c0a0b0' }} />
        いまは {online ? 'オンライン' : 'オフライン'}（どちらでも おなじ です）
      </p>
      <div className="tabs">
        {([['list', '👭 ともだち'], ['visit', '🏠 おうちを みる'], ['trade', '🎁 おためしこうかん'], ['qr', '📷 QRとうろく']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} className={`btn small${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'list' && (
        <>
          <div className="grid c2">
          {SAMPLE_FRIENDS.map((f) => (
            <div key={f.id} className="card row">
              <span style={{ fontSize: '2rem' }}>🧒</span>
              <div className="grow">
                <b>{f.player.name}</b>
                <div className="note" style={{ margin: 0 }}>なかま {f.friends.length}にん ・ かぐ {f.placed.length}こ</div>
              </div>
              <button className="btn small primary" onClick={() => { setVisit(f); setTab('visit'); }}>みにいく</button>
            </div>
          ))}
          </div>
          <p className="note">あんしんの ために：じゆうに もじを おくる チャット・いばしょの きょうゆう・ほんみょう や がっこうの なまえ の にゅうりょく は ありません。</p>
        </>
      )}

      {tab === 'visit' && (
        <>
          <div className="row" style={{ marginBottom: 6 }}>
            {SAMPLE_FRIENDS.map((f) => (
              <button key={f.id} className={`choice${visit.id === f.id ? ' on' : ''}`} style={{ minHeight: 38, padding: '4px 12px' }} onClick={() => setVisit(f)}>{f.player.name}</button>
            ))}
            <span className="note grow" style={{ margin: 0 }}>みるだけ の ばしょ です。ともだちの おうちを かえることは できません。</span>
          </div>
          <div className="preview-stage visit-stage fill">
            <Stage camera={[8, 9, 11]} fov={48}>
              <RoomScene
                mode="visit"
                placed={visit.placed}
                wallpaper={visit.wallpaper}
                flooring={visit.flooring}
                friends={visit.friends}
                player={visit.player}
                equipped={visit.equipped}
                reduceMotion={save.settings.reduceMotion}
              />
            </Stage>
          </div>
        </>
      )}

      {tab === 'trade' && (
        <>
          <div className="grid trade-steps fill">
          <div className="card">
            <b>① こうかんする あいて</b>
            <div className="row wrap" style={{ marginTop: 6 }}>
              {SAMPLE_FRIENDS.map((f) => (
                <button key={f.id} className={`choice${partner.id === f.id ? ' on' : ''}`} onClick={() => { setPartner(f); setGet(null); }}>{f.player.name}</button>
              ))}
            </div>
          </div>
          <div className="card">
            <b>② あなたが わたす もの（1こ）</b>
            {myMaterials.length === 0 && <span className="note">わたせる そざいが ないよ</span>}
            {/* そざいが おおい ときは ページで めくる */}
            <Paged
              className="grid trade-choices"
              items={myMaterials.map((m) => (
                <button key={m.id} className={`choice${give === m.id ? ' on' : ''}`} onClick={() => setGive(m.id)}>{m.icon} {m.name}</button>
              ))}
            />
          </div>
          <div className="card">
            <b>③ もらいたい もの（1こ）</b>
            <div className="row wrap" style={{ marginTop: 6 }}>
              {partner.offers.map((id) => (
                <button key={id} className={`choice${get === id ? ' on' : ''}`} onClick={() => setGet(id)}>{itemIcon(id)} {itemName(id)}</button>
              ))}
            </div>
          </div>
          </div>
          <button className="btn primary block" disabled={!give || !get} onClick={() => setConfirm(true)}>
            おためしで こうかんして みる
          </button>
        </>
      )}

      {tab === 'qr' && (
        <div className="card row" style={{ alignItems: 'center', gap: 16 }}>
          <FakeQr seed={save.player.name + save.createdAt} />
          <div className="grow">
            <b>あなたの ともだちコード（みほん）</b>
            <p className="note">これは みほんの もようです。ほんものの QRコードでの とうろくは まだ できません。</p>
            <button className="btn block" disabled>📷 カメラで よみとる（じゅんびちゅう）</button>
            <p className="note">ともだちとうろく には、こんご インターネットと おうちの ひとの かくにんが ひつように なる よていです。</p>
          </div>
        </div>
      )}

      {confirm && give && get && (
        <Modal title="おためしこうかん の かくにん">
          <div className="mock-banner">おためし なので、ほんとうの もちものは かわりません。</div>
          <p className="center" style={{ fontSize: '1.1rem' }}>
            {itemIcon(give)} {itemName(give)} ×1 を わたして<br />
            {itemIcon(get)} {itemName(get)} ×1 を もらう
          </p>
          <p className="center note">あいて：{partner.player.name}</p>
          <div className="actions">
            <button className="btn primary block" onClick={() => { setConfirm(false); setDone(true); }}>こうかんする（おためし）</button>
            <button className="btn block" onClick={() => setConfirm(false)}>やめる</button>
          </div>
        </Modal>
      )}
      {done && give && get && (
        <Modal title="おためしこうかん できた！" onClose={() => { setDone(false); setGive(null); setGet(null); }}>
          <div className="celebrate">🤝</div>
          <p className="center">
            {itemIcon(give)} → {partner.player.name}
            <br />
            {itemIcon(get)} → {save.player.name}
          </p>
          <div className="mock-banner">これは れんしゅう です。ほんとうの もちものは へっても ふえても いません。</div>
        </Modal>
      )}
    </Screen>
  );
}
