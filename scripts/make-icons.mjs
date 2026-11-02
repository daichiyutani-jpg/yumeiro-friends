// 依存なしでアプリアイコン（PNG）を生成する。パステルの背景に、白い星と桜色のハートを描く。
// 使い方: node scripts/make-icons.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x / size, y / size);
      const i = y * (size * 4 + 1) + 1 + x * 4;
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function inStar(x, y, cx, cy, r) {
  const dx = x - cx, dy = y - cy;
  const ang = Math.atan2(dy, dx) + Math.PI / 2;
  const d = Math.hypot(dx, dy);
  const k = (Math.cos((ang * 5) % (Math.PI * 2)) + 1) / 2; // 5つのとんがり
  return d < r * (0.45 + 0.55 * Math.pow(k, 3));
}
function inHeart(x, y, cx, cy, s) {
  const u = (x - cx) / s, v = -(y - cy) / s;
  return Math.pow(u * u + v * v - 1, 3) - u * u * v * v * v < 0;
}
function pixel(x, y) {
  let c = mix([255, 214, 232], [214, 200, 255], y);
  if (inStar(x, y, 0.5, 0.46, 0.3)) c = [255, 255, 255];
  if (inHeart(x, y, 0.5, 0.5, 0.09)) c = [239, 127, 180];
  return c;
}
for (const s of [180, 192, 512]) writeFileSync(`public/icons/icon-${s}.png`, png(s, pixel));
console.log('icons written');
