import { useState } from 'react';
import { MATERIALS, itemIcon, itemName } from '../game/data/items';
import { SAMPLE_FRIENDS, type SampleFriend } from '../game/data/sampleFriends';
import { getSpecies } from '../game/data/species';
import { addPal, decodePalCard, encodePalCard, formatPalCode, removePal } from '../game/logic/pals';
import type { PalCard } from '../game/types';
import { useGame } from '../state/store';
import { Stage } from '../three/Stage';
import { RoomScene } from '../three/RoomScene';
import { Confirm, CreatureIcon, Modal, Paged, Screen, useSave } from '../ui/common';
import { QrCode, QrScanner } from '../ui/qr';

type Tab = 'list' | 'visit' | 'trade' | 'qr';

/** おうちを みに いける あいて（QRで とうろくした ともだち と みほんの ともだち） */
interface Visitable {
  id: string;
  sample: boolean;
  code?: string;
  player: SampleFriend['player'];
  equipped: SampleFriend['equipped'];
  friends: SampleFriend['friends'];
  placed: SampleFriend['placed'];
  wallpaper: string;
  flooring: string;
}

const fromPal = (p: PalCard): Visitable => ({ ...p, id: `pal_${p.code}`, sample: false });
const fromSample = (f: SampleFriend): Visitable => ({ ...f, sample: true });

function SafeBanner() {
  return (
    <div className="safe-banner" role="note">
      🔒 ともだちとうろくは、めの まえの ともだちと QRコードを みせあって するよ。インターネットは つかわないよ。
    </div>
  );
}

function MockBanner() {
  return (
    <div className="mock-banner" role="note">
      🧪 こうかんは「おためし」だよ。みほんの ともだちと れんしゅう できるよ（もちものは かわらない）。
    </div>
  );
}

/** かけざんで おうちの ひとに かくにんして もらう（こたえは 4つから えらぶ。じゆうに もじは いれない） */
function makeGate() {
  const a = 6 + Math.floor(Math.random() * 4);
  const b = 6 + Math.floor(Math.random() * 4);
  const answer = a * b;
  const wrong = [answer - a, answer + a, answer - b, answer + b, answer + 1, answer - 1, answer + 10].filter((n) => n !== answer);
  const picks = [...new Set(wrong)].sort(() => Math.random() - 0.5).slice(0, 3);
  return { a, b, answer, choices: [answer, ...picks].sort((x, y) => x - y) };
}

/** よみとり → かくにん → おうちの ひとの かくにん → とうろく */
function PalScan({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const save = useSave();
  const apply = useGame((s) => s.apply);
  const [card, setCard] = useState<PalCard | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [gate, setGate] = useState<ReturnType<typeof makeGate> | null>(null);
  const [wrong, setWrong] = useState(false);

  const onText = (text: string) => {
    const c = text ? decodePalCard(text, Date.now()) : null;
    if (!c) {
      setMsg(text ? 'ゆめいろフレンズの QRコード じゃ ないみたい' : 'QRコードが みつからなかったよ');
      return false;
    }
    if (c.code === save.palCode) {
      setMsg('それは じぶんの QRコード だよ');
      return false;
    }
    setCard(c);
    return true;
  };

  if (card && gate) {
    return (
      <Modal title="おうちの ひとの かくにん" wide>
        <div className="modal-split">
          <div>
            <p className="note" style={{ margin: 0 }}>
              おうちの ひとへ：「{card.player.name}」さんを ともだちとして とうろくします。ゲームの なかの なまえ・すがた・おうちだけを この たんまつに ほぞんし、つうしんは しません。
            </p>
            {wrong && <p className="note" style={{ color: '#c0507a', margin: '6px 0 0' }}>ちがう みたい。おうちの ひとと いっしょに こたえてね。</p>}
          </div>
          <div>
            <p className="center" style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 8px' }}>{gate.a} × {gate.b} = ？</p>
            <div className="grid gate-choices">
              {gate.choices.map((n) => (
                <button
                  key={n}
                  className="btn"
                  onClick={() => {
                    if (n !== gate.answer) {
                      setWrong(true);
                      setGate(makeGate());
                      return;
                    }
                    const r = apply((s, now) => addPal(s, card, now));
                    if (r?.ok) onAdded();
                    else onClose();
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="actions">
              <button className="btn block" onClick={onClose}>やめる</button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  if (card) {
    const again = save.pals.some((p) => p.code === card.code);
    return (
      <Modal title={again ? `${card.player.name} を あたらしく する？` : `${card.player.name} と ともだちに なる？`} wide>
        <div className="modal-split">
          <div className="center">
            <div className="row" style={{ justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: '2.2rem' }}>🧒</span>
              {card.friends.map((f) => <CreatureIcon key={f.uid} look={getSpecies(f.speciesId).look} size={48} />)}
            </div>
            <p className="note" style={{ margin: '6px 0 0' }}>なかま {card.friends.length}にん ・ おうちの かぐ {card.placed.length}こ</p>
          </div>
          <div>
            <p className="note" style={{ margin: 0 }}>
              {again ? 'まえに とうろくした ともだち だよ。いまの すがたと おうちに かきかえるね。' : 'ともだちに なると、おうちを みに いけるよ。'}
              つぎに、おうちの ひとに かくにん して もらってね。
            </p>
            <div className="actions">
              <button className="btn primary block" onClick={() => { setWrong(false); setGate(makeGate()); }}>👪 おうちの ひとへ</button>
              <button className="btn block" onClick={onClose}>やめる</button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="ともだちの QRコードを よみとる" wide>
      <div className="modal-split">
        <QrScanner onText={onText} />
        <div>
          <p className="note" style={{ margin: 0 }}>
            ともだちに「📷 QRとうろく」の QRコードを みせて もらって、わくの なかに うつしてね。
          </p>
          <p className="note" style={{ margin: '6px 0 0' }}>カメラの えいぞうは この たんまつの なかだけで つかい、どこにも おくらないよ。</p>
          {msg && <p className="note" style={{ color: '#c0507a', margin: '6px 0 0' }}>{msg}</p>}
          <div className="actions">
            <button className="btn block" onClick={onClose}>やめる</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function SocialScreen() {
  const save = useSave();
  const apply = useGame((s) => s.apply);
  const [tab, setTab] = useState<Tab>('list');
  const visitables = [...save.pals.map(fromPal), ...SAMPLE_FRIENDS.map(fromSample)];
  const [visitId, setVisitId] = useState<string>(visitables[0].id);
  const visit = visitables.find((v) => v.id === visitId) ?? visitables[0];
  const [partner, setPartner] = useState<SampleFriend>(SAMPLE_FRIENDS[0]);
  const [give, setGive] = useState<string | null>(null);
  const [get, setGet] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [scan, setScan] = useState(false);
  const [bigQr, setBigQr] = useState(false);
  const [removing, setRemoving] = useState<PalCard | null>(null);
  const myMaterials = MATERIALS.filter((m) => (save.items[m.id] ?? 0) > 0);

  return (
    <Screen title="ともだち">
      {tab === 'trade' ? <MockBanner /> : <SafeBanner />}
      <div className="tabs">
        {([['list', `👭 ともだち（${save.pals.length}）`], ['visit', '🏠 おうちを みる'], ['trade', '🎁 おためしこうかん'], ['qr', '📷 QRとうろく']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} className={`btn small${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'list' && (
        <Paged
          className="grid pal-list"
          items={[
            ...(save.pals.length === 0
              ? [
                  <div key="empty" className="card row">
                    <span style={{ fontSize: '2rem' }}>📷</span>
                    <div className="grow note" style={{ margin: 0 }}>まだ いないよ。QRで とうろくしよう！</div>
                    <button className="btn small primary" onClick={() => setTab('qr')}>QRへ</button>
                  </div>,
                ]
              : []),
            ...visitables.map((f) => (
              <div key={f.id} className="card row">
                <span style={{ fontSize: '2rem' }}>{f.sample ? '🧸' : '🧒'}</span>
                <div className="grow">
                  <b>{f.player.name}</b>
                  <div className="note" style={{ margin: 0 }}>なかま {f.friends.length}にん ・ かぐ {f.placed.length}こ</div>
                </div>
                <button className="btn small primary" onClick={() => { setVisitId(f.id); setTab('visit'); }}>みにいく</button>
                {!f.sample && (
                  <button className="btn small" aria-label={`${f.player.name} を はずす`} onClick={() => setRemoving(save.pals.find((p) => `pal_${p.code}` === f.id) ?? null)}>🗑️</button>
                )}
              </div>
            )),
          ]}
        />
      )}

      {tab === 'visit' && (
        <div className="visit-layout fill">
          <Paged
            className="grid trade-choices"
            resetKey={visitables.length}
            items={visitables.map((f) => (
              <button key={f.id} className={`choice${visit.id === f.id ? ' on' : ''}`} onClick={() => setVisitId(f.id)}>{f.player.name}</button>
            ))}
          />
          <div className="preview-stage visit-stage">
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
            <span className="visit-caption">👀 みるだけ ・ {visit.sample ? 'みほんの おうち' : 'QRを よんだ ときの おうち'}</span>
          </div>
        </div>
      )}

      {tab === 'trade' && (
        <>
          <div className="grid trade-steps fill">
          <div className="card">
            <b>① こうかんする あいて</b>
            <Paged
              className="grid trade-choices"
              items={SAMPLE_FRIENDS.map((f) => (
                <button key={f.id} className={`choice${partner.id === f.id ? ' on' : ''}`} onClick={() => { setPartner(f); setGet(null); }}>{f.player.name}</button>
              ))}
            />
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
            <Paged
              className="grid trade-choices"
              resetKey={partner.id}
              items={partner.offers.map((id) => (
                <button key={id} className={`choice${get === id ? ' on' : ''}`} onClick={() => setGet(id)}>{itemIcon(id)} {itemName(id)}</button>
              ))}
            />
          </div>
          </div>
          <button className="btn primary block" disabled={!give || !get} onClick={() => setConfirm(true)}>
            おためしで こうかんして みる
          </button>
        </>
      )}

      {tab === 'qr' && (
        <div className="card row qr-card fill">
          <button className="qr-show" onClick={() => setBigQr(true)} aria-label="QRコードを おおきく みせる">
            <QrCode text={encodePalCard(save)} />
          </button>
          <div className="grow">
            <b>あなたの ともだちコード：{formatPalCode(save.palCode)}</b>
            <p className="note">めの まえの ともだちに この QRコードを よみとって もらってね（タップで おおきく なるよ）。</p>
            <button className="btn primary block" onClick={() => setScan(true)}>
              📷 ともだちの QRを よみとる
            </button>
            <p className="note">QRに はいるのは ゲームの なかの なまえ・すがた・チーム・おうち だけ。とうろくには おうちの ひとの かくにんが いるよ。</p>
          </div>
        </div>
      )}

      {bigQr && (
        <div className="qr-full" role="dialog" aria-modal="true" onClick={() => setBigQr(false)}>
          <QrCode text={encodePalCard(save)} />
          <div className="qr-full-side">
            <b>{save.player.name}</b>
            <span className="note">{formatPalCode(save.palCode)}</span>
            <span className="note">ともだちの カメラに みせてね</span>
            <button className="btn block" onClick={() => setBigQr(false)}>とじる</button>
          </div>
        </div>
      )}

      {scan && <PalScan onClose={() => setScan(false)} onAdded={() => { setScan(false); setTab('list'); }} />}

      {removing && (
        <Confirm
          title={`${removing.player.name} を はずす？`}
          text={<>ともだちの リストから はずします。また QRコードを よみとれば とうろく できるよ。</>}
          okLabel="はずす"
          onOk={() => { apply((s) => removePal(s, removing.code)); setRemoving(null); }}
          onCancel={() => setRemoving(null)}
        />
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
