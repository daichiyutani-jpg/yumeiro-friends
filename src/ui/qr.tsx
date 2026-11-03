// QRコードの ひょうじと よみとり。カメラの えいぞうは この たんまつの なかだけで つかい、どこにも おくらない。
import qrcode from 'qrcode-generator';
import { useEffect, useRef, useState } from 'react';

/** UTF-8 の バイトを 1もじ＝1バイト の もじれつに する（qrcode-generator の Byte モード用） */
function toByteString(text: string): string {
  return Array.from(new TextEncoder().encode(text), (b) => String.fromCharCode(b)).join('');
}

/** QRコードを かく。size は ひょうじの おおきさ（CSS px） */
export function QrCode({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const qr = qrcode(0, 'L');
    qr.addData(toByteString(text), 'Byte');
    qr.make();
    const n = qr.getModuleCount();
    const quiet = 3;
    const cell = 8;
    c.width = c.height = (n + quiet * 2) * cell;
    const g = c.getContext('2d');
    if (!g) return;
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#2b1f33';
    for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (qr.isDark(r, col)) g.fillRect((col + quiet) * cell, (r + quiet) * cell, cell, cell);
  }, [text]);
  return <canvas ref={ref} className={`qr-real ${className}`} role="img" aria-label="ともだちとうろく用の QRコード" />;
}

type Decoder = (data: Uint8ClampedArray, w: number, h: number) => string | null;
let decoderP: Promise<Decoder> | null = null;
/** jsQR は よみとる ときだけ よみこむ */
function loadDecoder(): Promise<Decoder> {
  decoderP ??= import('jsqr').then(({ default: jsQR }) => (data, w, h) => {
    const r = jsQR(data, w, h, { inversionAttempts: 'attemptBoth' });
    return r ? new TextDecoder().decode(new Uint8Array(r.binaryData)) : null;
  });
  return decoderP;
}

function decodeFrom(src: CanvasImageSource, sw: number, sh: number, canvas: HTMLCanvasElement, decode: Decoder): string | null {
  const scale = Math.min(1, 800 / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  g.drawImage(src, 0, 0, w, h);
  return decode(g.getImageData(0, 0, w, h).data, w, h);
}

/**
 * カメラで QRコードを よむ。onText が true を かえしたら とまる（ちがう QR なら false で よみつづける）。
 * カメラが つかえない ときは しゃしんを えらんで よむ ことも できる。
 */
export function QrScanner({ onText }: { onText: (text: string) => boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;
  const [state, setState] = useState<'starting' | 'live' | 'nocamera'>('starting');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    const stop = () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera');
        const [decode, s] = await Promise.all([
          loadDecoder(),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false }),
        ]);
        stream = s;
        if (stopped) return stop();
        const v = video.current!;
        v.srcObject = s;
        await v.play().catch(() => {});
        setState('live');
        const tick = () => {
          if (stopped) return;
          if (v.readyState >= 2 && v.videoWidth && canvas.current) {
            const text = decodeFrom(v, v.videoWidth, v.videoHeight, canvas.current, decode);
            if (text && onTextRef.current(text)) return stop();
          }
          timer = setTimeout(tick, 180);
        };
        tick();
      } catch {
        if (!stopped) setState('nocamera');
      }
    })();
    return stop;
  }, []);

  const fromPhoto = async (file: File | undefined) => {
    if (!file || !canvas.current) return;
    const decode = await loadDecoder();
    const img = await createImageBitmap(file).catch(() => null);
    const text = img ? decodeFrom(img, img.width, img.height, canvas.current, decode) : null;
    // QR が みつからない ときは '' を わたして しらせる
    onTextRef.current(text ?? '');
  };

  return (
    <div className="qr-scan">
      <div className="qr-scan-view">
        <video ref={video} playsInline muted aria-label="カメラの えいぞう" style={{ display: state === 'live' ? 'block' : 'none' }} />
        {state === 'live' && <div className="qr-scan-frame" aria-hidden="true" />}
        {state === 'starting' && <p className="note center">カメラを じゅんびちゅう…</p>}
        {state === 'nocamera' && (
          <p className="note center">
            カメラが つかえないみたい。
            <br />
            おうちの ひとに カメラの きょかを みてもらうか、したの ボタンで しゃしんを えらんでね。
          </p>
        )}
      </div>
      <canvas ref={canvas} style={{ display: 'none' }} />
      <label className="btn block qr-photo">
        🖼️ しゃしんで よみとる
        <input type="file" accept="image/*" onChange={(e) => { void fromPhoto(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
    </div>
  );
}
