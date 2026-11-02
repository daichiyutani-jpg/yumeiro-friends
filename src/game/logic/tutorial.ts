import type { SaveData } from '../types';
import { clone } from './core';

export type TutorialEvent =
  | 'created'
  | 'fed'
  | 'enterForest'
  | 'moved'
  | 'chest'
  | 'puzzle'
  | 'returnHome'
  | 'planted'
  | 'placed';

/** step 番号 → そのステップを終わらせる出来事と、表示する案内 */
export const TUTORIAL_STEPS: { event: TutorialEvent; text: string }[] = [
  { event: 'created', text: 'あなたの なまえと みためを きめよう' },
  { event: 'fed', text: 'さいしょの なかま「さくらん」に ごはんを あげよう。「なかま」→ さくらん →「ごはん」' },
  { event: 'enterForest', text: '「ぼうけん」を おして、さくらの森へ いこう' },
  { event: 'moved', text: 'ひだりの まるい スティックを うごかして あるいてみよう' },
  { event: 'chest', text: 'ちかくの たからばこに ちかづいて「あける」を おそう' },
  { event: 'puzzle', text: 'ひだりの「つるの とびら」で、さくらんの はなの ちからを つかおう' },
  { event: 'returnHome', text: 'はじめの ばしょに ある にじの ゲートから まちへ かえろう' },
  { event: 'planted', text: '「おはなばたけ」で たねを うえよう' },
  { event: 'placed', text: '「まちづくり」で かぐを おいてみよう' },
];

export function tutorialText(s: SaveData): string | null {
  if (s.tutorial.done) return null;
  return TUTORIAL_STEPS[s.tutorial.step]?.text ?? null;
}

/** 出来事が今のステップと合っていれば次へ進める（順番どおりでない出来事は無視） */
export function advanceTutorial(state: SaveData, event: TutorialEvent): SaveData {
  if (state.tutorial.done) return state;
  const cur = TUTORIAL_STEPS[state.tutorial.step];
  if (!cur || cur.event !== event) return state;
  const s = clone(state);
  s.tutorial.step += 1;
  if (s.tutorial.step >= TUTORIAL_STEPS.length) s.tutorial.done = true;
  return s;
}

export function skipTutorial(state: SaveData): SaveData {
  const s = clone(state);
  s.tutorial.done = true;
  return s;
}
