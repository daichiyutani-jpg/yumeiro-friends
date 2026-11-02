import { useEffect } from 'react';
import { useGame } from './state/store';
import { Toasts } from './ui/common';
import { setSoundEnabled } from './ui/sound';
import { AdventureScreen } from './screens/Adventure';
import { CreateHeroScreen } from './screens/CreateHero';
import { DexScreen } from './screens/Dex';
import { DressupScreen } from './screens/Dressup';
import { EggsScreen } from './screens/Eggs';
import { FriendDetailScreen } from './screens/FriendDetail';
import { FriendsScreen } from './screens/Friends';
import { GardenScreen } from './screens/Garden';
import { HomeScreen } from './screens/Home';
import { ItemsScreen } from './screens/Items';
import { MinigameScreen } from './screens/Minigame';
import { SettingsScreen } from './screens/Settings';
import { ShopScreen } from './screens/Shop';
import { SocialScreen } from './screens/Social';
import { TitleScreen } from './screens/Title';
import { TownEditScreen } from './screens/TownEdit';
import { WorldsScreen } from './screens/Worlds';

export function App() {
  const status = useGame((s) => s.status);
  const screen = useGame((s) => s.screen);
  const saveError = useGame((s) => s.saveError);
  const flush = useGame((s) => s.flush);
  const settings = useGame((s) => s.save?.settings);

  useEffect(() => {
    setSoundEnabled(settings?.sound ?? true);
    document.body.classList.toggle('big-text', !!settings?.bigText);
  }, [settings?.sound, settings?.bigText]);

  let content;
  if (status === 'loading') content = <div className="title-screen"><p className="status-line">よみこみちゅう…</p></div>;
  else if (status === 'title') content = <TitleScreen />;
  else if (status === 'create') content = <CreateHeroScreen />;
  else {
    switch (screen) {
      case 'home': content = <HomeScreen />; break;
      case 'adventure': content = <AdventureScreen />; break;
      case 'worlds': content = <WorldsScreen />; break;
      case 'friends': content = <FriendsScreen />; break;
      case 'friend': content = <FriendDetailScreen />; break;
      case 'dressup': content = <DressupScreen />; break;
      case 'dex': content = <DexScreen />; break;
      case 'items': content = <ItemsScreen />; break;
      case 'town': content = <TownEditScreen />; break;
      case 'eggs': content = <EggsScreen />; break;
      case 'shop': content = <ShopScreen />; break;
      case 'garden': content = <GardenScreen />; break;
      case 'minigame': content = <MinigameScreen />; break;
      case 'social': content = <SocialScreen />; break;
      case 'settings': content = <SettingsScreen />; break;
    }
  }
  return (
    <div className="app">
      {content}
      <Toasts />
      {saveError && (
        <div className="save-error" role="alert">
          <span className="grow">⚠️ {saveError}</span>
          <button className="btn small" onClick={() => void flush()}>もういちど</button>
        </div>
      )}
    </div>
  );
}
