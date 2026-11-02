import { WORLDS } from '../game/data/catalog';
import { forestProgress } from '../game/logic/adventure';
import { useGame } from '../state/store';
import { Screen, useSave } from '../ui/common';
import { TeamPicker } from './Adventure';

export function WorldsScreen() {
  const save = useSave();
  const go = useGame((s) => s.go);
  const toast = useGame((s) => s.toast);
  const p = forestProgress(save);
  return (
    <Screen title="ぼうけんの ちず">
      {WORLDS.map((w) => (
        <button
          key={w.id}
          className={`world-card${w.implemented ? '' : ' locked'}`}
          onClick={() => (w.implemented ? go('adventure') : toast(`${w.name}は まだ じゅんびちゅう だよ。おたのしみに！`))}
        >
          <span className="ic" style={{ background: w.color }}>{w.implemented ? w.icon : '🔒'}</span>
          <span className="grow">
            <b style={{ fontSize: '1.05rem' }}>{w.name}</b>
            <br />
            {w.implemented ? (
              <span className="note" style={{ margin: 0 }}>たからばこ {p.chests}/{p.chestTotal} ・ しかけ {p.puzzles}/{p.puzzleTotal} ・ であい {p.friends}/{p.friendTotal}</span>
            ) : (
              <span className="tag">{w.unlockText}</span>
            )}
          </span>
          {w.implemented && <span className="btn primary small">いく ▶</span>}
        </button>
      ))}
      <div className="section-title">🐾 つれていく チーム（3にん まで）</div>
      {save.friends.length === 0 ? <p className="note">まだ なかまが いないよ。</p> : <TeamPicker />}
    </Screen>
  );
}
