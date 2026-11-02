/*
 * ゆめいろフレンズ Service Worker
 * ビルド時（vite.config.ts の serviceWorkerPlugin）に VERSION と ASSETS の値が埋め込まれ、dist/sw.js として出力される。
 * パスはすべて Service Worker のスコープからの相対パスなので、GitHub Pages のサブディレクトリでも動く。
 */
const VERSION = '__VERSION__';
const CACHE_PREFIX = 'yumeiro-';
const CACHE_NAME = CACHE_PREFIX + VERSION;
const ASSETS = __ASSETS__;

const scopeUrl = (path) => new URL(path, self.registration.scope).href;
const INDEX_URL = scopeUrl('index.html');
const OFFLINE_URL = scopeUrl('offline.html');

self.addEventListener('install', (event) => {
  // 全ファイルを保存できた場合のみインストール成功とする（1つでも失敗したら全体をやり直す）
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS.map((path) => new Request(scopeUrl(path), { cache: 'reload' }))),
    ),
  );
});

self.addEventListener('activate', (event) => {
  // このアプリの古いキャッシュだけを削除する（セーブデータは IndexedDB にあるので影響しない）
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'GET_STATUS') {
    const port = event.ports && event.ports[0];
    if (!port) return;
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        const results = await Promise.all(ASSETS.map((path) => cache.match(scopeUrl(path))));
        const cached = results.filter(Boolean).length;
        port.postMessage({ version: VERSION, total: ASSETS.length, cached, complete: cached === ASSETS.length });
      }),
    );
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // ページの読み込み: キャッシュ済みの index.html を返す（?openExternalBrowser=1 などのクエリは無視）
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = (await cache.match(INDEX_URL)) || (await caches.match(INDEX_URL));
        if (cached) return cached;
        try {
          return await fetch(request);
        } catch {
          return (await caches.match(OFFLINE_URL)) || Response.error();
        }
      })(),
    );
    return;
  }

  // それ以外（JS・CSS・画像など）: キャッシュ優先、無ければネットワーク
  // サーバーが Vary: Origin を返すと、Origin 付きの module script 要求と precache が一致しないので ignoreVary にする
  event.respondWith(
    (async () => {
      const cached =
        (await caches.match(request, { ignoreVary: true })) ||
        (await caches.match(request, { ignoreVary: true, ignoreSearch: true }));
      if (cached) return cached;
      return fetch(request);
    })(),
  );
});
