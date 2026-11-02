import type { SaveData } from '../types';
import { clone } from './core';

/**
 * ゲーム内時刻（clock.gameTime）を進める。花の成長・卵の孵化などはすべてこの時刻で判定する。
 *
 * ローカルだけのゲームなので端末の時刻変更を完全には防げない。そこで簡単な対策として:
 * - 端末の時刻が戻った（差がマイナス）時は、ゲーム内時刻を進めない（巻き戻しもしない）。
 * - 一度に進む時間は MAX_JUMP までにする（極端に未来へ変更しても、それ以上は進まない）。
 * 卵や花は長くても数十分で終わるので、ふつうに遊ぶ子どもには影響がない。
 */
export const MAX_JUMP = 3 * 24 * 60 * 60 * 1000;
const BACKWARD_TOLERANCE = 2 * 60 * 1000;

export function advanceClock(state: SaveData, realNow: number): SaveData {
  if (!Number.isFinite(realNow)) return state;
  const delta = realNow - state.clock.lastReal;
  if (delta === 0) return state;
  const s = clone(state);
  if (delta < 0) {
    // 時刻が戻った: 少しのずれ（端末の自動補正など）は気にしない
    s.clock.lastReal = realNow;
    if (-delta > BACKWARD_TOLERANCE) s.clock.warned = true;
    return s;
  }
  s.clock.gameTime += Math.min(delta, MAX_JUMP);
  if (delta > MAX_JUMP) s.clock.warned = true;
  s.clock.lastReal = realNow;
  return s;
}

/** 残り時間を子ども向けの文字にする */
export function formatRemain(ms: number): string {
  if (ms <= 0) return 'もうすぐ';
  const sec = Math.ceil(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) return `${Math.floor(m / 60)}じかん ${m % 60}ふん`;
  if (m > 0) return `${m}ふん ${s}びょう`;
  return `${s}びょう`;
}
