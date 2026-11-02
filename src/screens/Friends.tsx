import { useState } from 'react';
import { ABILITY_INFO, RARITY_INFO, getSpecies } from '../game/data/species';
import { displayName, friendAbilities } from '../game/logic/friends';
import { useGame } from '../state/store';
import { CreatureIcon, Paged, Screen, useSave } from '../ui/common';

type Sort = 'new' | 'level' | 'love';

export function FriendsScreen() {
  const save = useSave();
  const go = useGame((s) => s.go);
  const [sort, setSort] = useState<Sort>('new');
  const list = [...save.friends].sort((a, b) =>
    sort === 'level' ? b.level - a.level : sort === 'love' ? b.affection - a.affection : b.obtainedAt - a.obtainedAt,
  );
  return (
    <Screen title={`なかま（${save.friends.length}）`}>
      <div className="tabs">
        {([['new', 'あたらしい じゅん'], ['level', 'レベル じゅん'], ['love', 'なかよし じゅん']] as [Sort, string][]).map(([k, l]) => (
          <button key={k} className={`btn small${sort === k ? ' on' : ''}`} onClick={() => setSort(k)}>
            {l}
          </button>
        ))}
      </div>
      <p className="note" style={{ marginTop: 0 }}>ピンクの わくが ぼうけんの チーム。タップで おせわ・そだてる。なかまは 森の であい・たまご・ずかんの よびかけ で ふえるよ。</p>
      <Paged
        className="grid c3"
        resetKey={sort}
        items={list.map((f) => {
          const sp = getSpecies(f.speciesId);
          const inTeam = save.team.includes(f.uid);
          return (
            <button key={f.uid} className={`friend-card${inTeam ? ' team' : ''}`} onClick={() => go('friend', f.uid)}>
              {inTeam && <span className="in-team">チーム</span>}
              <CreatureIcon look={sp.look} size={52} />
              <div className="nm">{displayName(f)}</div>
              <div className="lv">
                Lv.{f.level} ・ {RARITY_INFO[sp.rarity].stars}
              </div>
              <div className="lv">
                💗{f.affection} {friendAbilities(f).map((a) => ABILITY_INFO[a].icon).join('')}
              </div>
            </button>
          );
        })}
      />
      {save.friends.length === 0 && <p className="note center">まだ なかまが いないよ。</p>}
    </Screen>
  );
}
