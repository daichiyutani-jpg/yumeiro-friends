import { WORLDS } from '../game/data/catalog';
import { SEA_UNLOCK_CHESTS, forestProgress, isWorldUnlocked } from '../game/logic/adventure';
import { useGame } from '../state/store';
import { Paged, Screen, useSave } from '../ui/common';
import { TeamPicker } from './Adventure';

export function WorldsScreen() {
  const save = useSave();
  const go = useGame((s) => s.go);
  const toast = useGame((s) => s.toast);
  // 左に つれていく チーム、右に いける ばしょ
  const team = (
    <>
      <div className="section-title" style={{ margin: '0 4px' }}>🐾 つれていく チーム（3にん まで）</div>
      {save.friends.length === 0 ? <p className="note">まだ なかまが いないよ。</p> : <TeamPicker />}
    </>
  );
  return (
    <Screen title="ぼうけんの ちず" side={team}>
      <Paged
        className="grid list"
        items={WORLDS.map((w) => {
          const open = w.implemented && isWorldUnlocked(save, w.id);
          const p = forestProgress(save, w.id);
          const left = SEA_UNLOCK_CHESTS - forestProgress(save, 'sakura').chests;
          return (
            <button
              key={w.id}
              className={`world-card${open ? '' : ' locked'}`}
              onClick={() =>
                open
                  ? go('adventure', w.id)
                  : toast(w.implemented ? `さくらの森で たからばこを あと ${left}こ あけると いけるよ` : `${w.name}は まだ じゅんびちゅう だよ。おたのしみに！`)
              }
            >
              <span className="ic" style={{ background: w.color }}>{open ? w.icon : '🔒'}</span>
              <span className="grow">
                <b style={{ fontSize: '1rem' }}>{w.name}</b>
                <br />
                {open ? (
                  <span className="note" style={{ margin: 0 }}>たからばこ {p.chests}/{p.chestTotal} ・ しかけ {p.puzzles}/{p.puzzleTotal} ・ であい {p.friends}/{p.friendTotal}</span>
                ) : (
                  <span className="tag">{w.implemented ? `${w.unlockText}（あと ${left}こ）` : w.unlockText}</span>
                )}
              </span>
              {open && <span className="btn primary small">いく ▶</span>}
            </button>
          );
        })}
      />
    </Screen>
  );
}
