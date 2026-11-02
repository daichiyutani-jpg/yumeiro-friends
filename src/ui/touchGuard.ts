// スマホで スティックを うごかした時に ページごと うごく（ひっぱって スクロール・
// ゴムのような はねかえり・ひっぱって 更新・ピンチで 拡大）のを ふせぐ。
// スクロールして よい ばしょ（.body・.modal・横に ながい リスト）だけは そのまま うごかす。

const SCROLLABLE = '.body, .modal, .tabs, .palette, .scroll-ok';

function canScroll(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const el = target.closest(SCROLLABLE);
  if (!el) return false;
  return el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
}

export function installTouchGuard(): void {
  document.addEventListener(
    'touchmove',
    (e) => {
      // 2本ゆびは ピンチ拡大なので いつでも とめる
      if (e.touches.length > 1 || !canScroll(e.target)) e.preventDefault();
    },
    { passive: false },
  );
  // iOS Safari の ピンチ拡大
  for (const type of ['gesturestart', 'gesturechange']) {
    document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
  }
  // ながおしで でる メニュー（スティックを おしつづけた時）
  document.addEventListener('contextmenu', (e) => {
    if (e.target instanceof Element && !e.target.closest('input, textarea')) e.preventDefault();
  });
}
