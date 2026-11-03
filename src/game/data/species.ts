import type { Ability, Species } from '../types';

export const ABILITY_INFO: Record<Ability, { name: string; icon: string; color: string; text: string }> = {
  flower: { name: 'はな', icon: '🌷', color: '#ff8fbf', text: 'はなの しかけを ひらく' },
  light: { name: 'ひかり', icon: '✨', color: '#ffc94d', text: 'くらい ばしょを てらす' },
  power: { name: 'ちから', icon: '💪', color: '#ff9d6b', text: 'いわを うごかす' },
  water: { name: 'みず', icon: '💧', color: '#5fb8ff', text: 'みずの なかを さがす' },
  fly: { name: 'そら', icon: '🪽', color: '#9f8bff', text: 'たかい ところへ とぶ' },
};

export const RARITY_INFO = {
  1: { name: 'ふつう', stars: '★' },
  2: { name: 'レア', stars: '★★' },
  3: { name: 'スーパーレア', stars: '★★★' },
} as const;

/**
 * 12しゅるいの基本の なかま と、その進化先。
 * evolutions の to は同じ配列内の進化先IDを指す。
 */
export const SPECIES: Species[] = [
  // 1. 桜 × ウサギ
  {
    id: 'sakuran', name: 'さくらん', animal: 'うさぎ', theme: 'さくら', rarity: 1, ability: 'flower',
    baseStats: { power: 8, explore: 12 }, growth: { power: 2, explore: 3 },
    favoriteFood: 'strawberry', personality: 'げんきで やさしい', skills: ['はなひらき', 'ぴょんぴょんジャンプ'],
    evolutions: [
      { to: 'hanasakuran', level: 5, affection: 20, items: { petal: 5 }, hint: 'はなが いっぱい さいた すがた' },
      { to: 'hoshisakuran', level: 5, affection: 20, items: { star: 3 }, hint: 'ほしの ひかりを まとった すがた' },
      { to: 'namisakuran', level: 5, affection: 20, items: { shell: 3 }, hint: 'うみの いろに そまった すがた' },
    ],
    unlock: 'さいしょの なかま', description: 'さくらの はなびらから うまれた うさぎ。みみの さきに いつも はなが さいている。',
    look: { body: '#ffd1e3', belly: '#fff5f9', accent: '#ff8fbf', ears: 'long', tail: 'puff', motif: 'flower' },
  },
  { id: 'hanasakuran', baseId: 'sakuran', name: 'はなさくらん', animal: 'うさぎ', theme: 'はな', rarity: 2, ability: 'flower',
    baseStats: { power: 12, explore: 20 }, growth: { power: 3, explore: 4 }, favoriteFood: 'strawberry', personality: 'げんきで やさしい',
    skills: ['はなひらき', 'はなふぶき'], evolutions: [], unlock: 'さくらんが はなびらで しんか',
    description: 'せなかに はなの マントを つけた うさぎ。とおった あとに はなが さく。',
    look: { body: '#ffc0da', belly: '#fff0f6', accent: '#ff6fae', ears: 'long', tail: 'puff', motif: 'flower', extra: 'cape', scale: 1.1 } },
  { id: 'hoshisakuran', baseId: 'sakuran', name: 'ほしさくらん', animal: 'うさぎ', theme: 'ほし', rarity: 2, ability: 'flower', extraAbility: 'light',
    baseStats: { power: 11, explore: 21 }, growth: { power: 3, explore: 4 }, favoriteFood: 'strawberry', personality: 'げんきで やさしい',
    skills: ['はなひらき', 'ほしあかり'], evolutions: [], unlock: 'さくらんが ほしの かけらで しんか',
    description: 'よるに なると みみが ほしのように ひかる うさぎ。くらい みちも へっちゃら。',
    look: { body: '#e4d6ff', belly: '#fffbe8', accent: '#ffd84d', ears: 'long', tail: 'puff', motif: 'star', extra: 'halo', scale: 1.1 } },
  { id: 'namisakuran', baseId: 'sakuran', name: 'なみさくらん', animal: 'うさぎ', theme: 'うみ', rarity: 2, ability: 'flower', extraAbility: 'water',
    baseStats: { power: 13, explore: 19 }, growth: { power: 3, explore: 4 }, favoriteFood: 'strawberry', personality: 'げんきで やさしい',
    skills: ['はなひらき', 'しゃぼんスプラッシュ'], evolutions: [], unlock: 'さくらんが かいがらで しんか',
    description: 'うみの かぜが すきな うさぎ。およぐのが とくい。',
    look: { body: '#c9ecff', belly: '#f2fbff', accent: '#ff9ec7', ears: 'long', tail: 'puff', motif: 'bubble', extra: 'wings', scale: 1.1 } },

  // 2. 星 × キツネ
  {
    id: 'kirakon', name: 'きらこん', animal: 'きつね', theme: 'ほし', rarity: 2, ability: 'light',
    baseStats: { power: 10, explore: 14 }, growth: { power: 2, explore: 3 },
    favoriteFood: 'starcandy', personality: 'ちょっぴり はずかしがりや', skills: ['ほしあかり', 'きらきらステップ'],
    evolutions: [
      { to: 'nagarekon', level: 5, affection: 20, items: { star: 5 }, hint: 'ながれぼしのように はやい すがた' },
      { to: 'yozorakon', level: 5, affection: 20, items: { drop: 3 }, hint: 'よぞらの いろを した すがた' },
    ],
    unlock: 'さくらの森の どうくつの ちかくで であえる / ほしぞらの しまで であえる', description: 'しっぽの さきに ちいさな ほしが ついた きつね。よるの さんぽが すき。',
    look: { body: '#ffd9a8', belly: '#fff8ec', accent: '#ffe066', ears: 'pointy', tail: 'fluffy', motif: 'star' },
  },
  { id: 'nagarekon', baseId: 'kirakon', name: 'ながれこん', animal: 'きつね', theme: 'ながれぼし', rarity: 3, ability: 'light', extraAbility: 'fly',
    baseStats: { power: 14, explore: 22 }, growth: { power: 3, explore: 5 }, favoriteFood: 'starcandy', personality: 'ちょっぴり はずかしがりや',
    skills: ['ほしあかり', 'ながれぼしダッシュ'], evolutions: [], unlock: 'きらこんが ほしの かけらで しんか',
    description: 'ながれぼしに のって そらを かける きつね。ねがいごとを きいてくれるかも。',
    look: { body: '#fff0b8', belly: '#ffffff', accent: '#ffb84d', ears: 'pointy', tail: 'fluffy', motif: 'star', extra: 'wings', scale: 1.1 } },
  { id: 'yozorakon', baseId: 'kirakon', name: 'よぞらこん', animal: 'きつね', theme: 'よぞら', rarity: 3, ability: 'light',
    baseStats: { power: 15, explore: 21 }, growth: { power: 4, explore: 4 }, favoriteFood: 'starcandy', personality: 'ちょっぴり はずかしがりや',
    skills: ['ほしあかり', 'つきあかりの うた'], evolutions: [], unlock: 'きらこんが まほうの しずくで しんか / ほしぞらの しまで であえる',
    description: 'からだに よぞらを うつした きつね。せなかに ほしが きらめく。',
    look: { body: '#9d8fe0', belly: '#e9e4ff', accent: '#ffe066', ears: 'pointy', tail: 'fluffy', motif: 'moon', extra: 'halo', scale: 1.1 } },

  // 3. お菓子 × クマ
  {
    id: 'macaron', name: 'まかろん', animal: 'くま', theme: 'おかし', rarity: 1, ability: 'power',
    baseStats: { power: 15, explore: 8 }, growth: { power: 4, explore: 2 },
    favoriteFood: 'honeybread', personality: 'のんびりや', skills: ['よいしょパワー', 'あまい におい'],
    evolutions: [
      { to: 'patibear', level: 5, affection: 20, items: { cotton: 3 }, hint: 'パティシエの ぼうしを かぶった すがた' },
      { to: 'chocobear', level: 5, affection: 20, items: { clover: 1, petal: 3 }, hint: 'チョコレートいろの すがた' },
    ],
    unlock: 'さくらの森の ひろばで であえる', description: 'おかしの においが する くま。ちからもちで、おもい ものも はこべる。',
    look: { body: '#f7c6a3', belly: '#fff1e1', accent: '#ff9ec7', ears: 'round', tail: 'puff', motif: 'candy' },
  },
  { id: 'patibear', baseId: 'macaron', name: 'パティベア', animal: 'くま', theme: 'おかし', rarity: 2, ability: 'power',
    baseStats: { power: 22, explore: 12 }, growth: { power: 5, explore: 2 }, favoriteFood: 'honeybread', personality: 'のんびりや',
    skills: ['よいしょパワー', 'ケーキづくり'], evolutions: [], unlock: 'まかろんが ふわふわの わたで しんか / おかしの まちで であえる',
    description: 'まいにち おかしを やいている くま。できたては みんなに おすそわけ。',
    look: { body: '#ffe0c7', belly: '#ffffff', accent: '#ff7fae', ears: 'round', tail: 'puff', motif: 'candy', extra: 'crown', scale: 1.15 } },
  { id: 'chocobear', baseId: 'macaron', name: 'ショコベア', animal: 'くま', theme: 'チョコ', rarity: 2, ability: 'power', extraAbility: 'flower',
    baseStats: { power: 24, explore: 10 }, growth: { power: 5, explore: 2 }, favoriteFood: 'honeybread', personality: 'のんびりや',
    skills: ['よいしょパワー', 'チョコの はな'], evolutions: [], unlock: 'まかろんが クローバーと はなびらで しんか',
    description: 'チョコいろの くま。せなかに さくらの かざりを つけている。',
    look: { body: '#b98a6e', belly: '#f3dcc8', accent: '#ffb3d1', ears: 'round', tail: 'puff', motif: 'flower', extra: 'cape', scale: 1.15 } },

  // 4. 泡 × ネコ
  {
    id: 'awanya', name: 'あわにゃ', animal: 'ねこ', theme: 'あわ', rarity: 1, ability: 'water',
    baseStats: { power: 9, explore: 13 }, growth: { power: 2, explore: 3 },
    favoriteFood: 'fishjelly', personality: 'きまぐれ', skills: ['みずさがし', 'しゃぼんだま'],
    evolutions: [
      { to: 'marinya', level: 5, affection: 20, items: { shell: 4 }, hint: 'うみの ひめの ような すがた' },
      { to: 'shabonya', level: 5, affection: 20, items: { drop: 3 }, hint: 'しゃぼんだまで うかぶ すがた' },
    ],
    unlock: 'さくらの森の おがわで であえる', description: 'くしゃみを すると しゃぼんだまが でる ねこ。みずあそびが だいすき。',
    look: { body: '#bfe6ff', belly: '#f4fbff', accent: '#7fd0ff', ears: 'pointy', tail: 'thin', motif: 'bubble' },
  },
  { id: 'marinya', baseId: 'awanya', name: 'マリにゃ', animal: 'ねこ', theme: 'うみ', rarity: 2, ability: 'water',
    baseStats: { power: 13, explore: 21 }, growth: { power: 3, explore: 4 }, favoriteFood: 'fishjelly', personality: 'きまぐれ',
    skills: ['みずさがし', 'なみのり'], evolutions: [], unlock: 'あわにゃが かいがらで しんか',
    description: 'かいがらの かんむりを つけた ねこ。うみの おしろに すんでいた という うわさ。',
    look: { body: '#9fd8ff', belly: '#eefaff', accent: '#ffb3d1', ears: 'pointy', tail: 'thin', motif: 'bubble', extra: 'crown', scale: 1.1 } },
  { id: 'shabonya', baseId: 'awanya', name: 'シャボにゃ', animal: 'ねこ', theme: 'しゃぼんだま', rarity: 2, ability: 'water', extraAbility: 'fly',
    baseStats: { power: 12, explore: 22 }, growth: { power: 3, explore: 4 }, favoriteFood: 'fishjelly', personality: 'きまぐれ',
    skills: ['みずさがし', 'ふわふわバブル'], evolutions: [], unlock: 'あわにゃが まほうの しずくで しんか / はなの ていえんで であえる',
    description: 'おおきな しゃぼんだまに のって ふわふわ うかぶ ねこ。',
    look: { body: '#e3d4ff', belly: '#ffffff', accent: '#9fe8ff', ears: 'pointy', tail: 'thin', motif: 'bubble', extra: 'halo', scale: 1.1 } },

  // 5. 雲 × ヒツジ
  {
    id: 'mokomoku', name: 'もこもく', animal: 'ひつじ', theme: 'くも', rarity: 1, ability: 'fly',
    baseStats: { power: 8, explore: 13 }, growth: { power: 2, explore: 3 },
    favoriteFood: 'cottoncandy', personality: 'おっとり', skills: ['ふわりジャンプ', 'おひるね'],
    evolutions: [
      { to: 'nijimoko', level: 5, affection: 20, items: { petal: 3, star: 1 }, hint: 'にじいろの けいとの すがた' },
      { to: 'ohisamamoko', level: 5, affection: 20, items: { star: 3 }, hint: 'おひさまの ように あたたかい すがた' },
    ],
    unlock: 'さくらの森の はらっぱで であえる / はなの ていえんで であえる', description: 'からだが くもで できた ひつじ。かぜに のって ふわっと とべる。',
    look: { body: '#ffffff', belly: '#f3f0ff', accent: '#b9a8ff', ears: 'tiny', tail: 'puff', motif: 'cloud' },
  },
  { id: 'nijimoko', baseId: 'mokomoku', name: 'にじもこ', animal: 'ひつじ', theme: 'にじ', rarity: 2, ability: 'fly', extraAbility: 'flower',
    baseStats: { power: 12, explore: 20 }, growth: { power: 3, explore: 4 }, favoriteFood: 'cottoncandy', personality: 'おっとり',
    skills: ['ふわりジャンプ', 'にじの はし'], evolutions: [], unlock: 'もこもくが はなびらと ほしで しんか',
    description: 'あめあがりに あらわれる、にじいろの ひつじ。',
    look: { body: '#ffe6f2', belly: '#fffbe0', accent: '#8fd3ff', ears: 'tiny', tail: 'puff', motif: 'rainbow', extra: 'wings', scale: 1.1 } },
  { id: 'ohisamamoko', baseId: 'mokomoku', name: 'おひさまもこ', animal: 'ひつじ', theme: 'おひさま', rarity: 2, ability: 'fly', extraAbility: 'light',
    baseStats: { power: 13, explore: 20 }, growth: { power: 3, explore: 4 }, favoriteFood: 'cottoncandy', personality: 'おっとり',
    skills: ['ふわりジャンプ', 'ぽかぽかライト'], evolutions: [], unlock: 'もこもくが ほしの かけらで しんか',
    description: 'だきしめると ぽかぽか あたたかい ひつじ。',
    look: { body: '#fff3c4', belly: '#ffffff', accent: '#ffb84d', ears: 'tiny', tail: 'puff', motif: 'star', extra: 'halo', scale: 1.1 } },

  // 6. 宝石 × リス
  {
    id: 'jewerisu', name: 'ジュエりす', animal: 'りす', theme: 'ほうせき', rarity: 2, ability: 'light',
    baseStats: { power: 9, explore: 15 }, growth: { power: 2, explore: 4 },
    favoriteFood: 'nutcake', personality: 'しっかりもの', skills: ['ほうせきライト', 'たからさがし'],
    evolutions: [
      { to: 'rubirisu', level: 5, affection: 20, items: { petal: 5, star: 1 }, hint: 'あかい ほうせきの すがた' },
      { to: 'safarisu', level: 5, affection: 20, items: { drop: 3, shell: 1 }, hint: 'あおい ほうせきの すがた' },
    ],
    unlock: 'ほしの かけら4こ と まほうの しずく2こ で よびかける / うみの せかいの いわばで であえる', craft: { star: 4, drop: 2 },
    description: 'しっぽに ほうせきを かくしている りす。ひかる ものを みつけるのが とくい。',
    look: { body: '#d9c4ff', belly: '#fff7ff', accent: '#7fe3d6', ears: 'tuft', tail: 'fluffy', motif: 'gem' },
  },
  { id: 'rubirisu', baseId: 'jewerisu', name: 'ルビりす', animal: 'りす', theme: 'ルビー', rarity: 3, ability: 'light', extraAbility: 'power',
    baseStats: { power: 16, explore: 22 }, growth: { power: 4, explore: 4 }, favoriteFood: 'nutcake', personality: 'しっかりもの',
    skills: ['ほうせきライト', 'ルビーハート'], evolutions: [], unlock: 'ジュエりすが はなびらで しんか',
    description: 'むねに あかい ハートの ほうせきを もつ りす。',
    look: { body: '#ffc2d4', belly: '#fff3f7', accent: '#ff4d7e', ears: 'tuft', tail: 'fluffy', motif: 'gem', extra: 'crown', scale: 1.1 } },
  { id: 'safarisu', baseId: 'jewerisu', name: 'サファりす', animal: 'りす', theme: 'サファイア', rarity: 3, ability: 'light', extraAbility: 'water',
    baseStats: { power: 13, explore: 25 }, growth: { power: 3, explore: 5 }, favoriteFood: 'nutcake', personality: 'しっかりもの',
    skills: ['ほうせきライト', 'あおい ひかり'], evolutions: [], unlock: 'ジュエりすが しずくで しんか',
    description: 'みずうみの いろの ほうせきを もつ りす。',
    look: { body: '#bcd8ff', belly: '#f2f8ff', accent: '#4d8cff', ears: 'tuft', tail: 'fluffy', motif: 'gem', extra: 'halo', scale: 1.1 } },

  // 7. 花 × シカ
  {
    id: 'hanajika', name: 'はなじか', animal: 'しか', theme: 'はな', rarity: 2, ability: 'flower',
    baseStats: { power: 11, explore: 13 }, growth: { power: 3, explore: 3 },
    favoriteFood: 'strawberry', personality: 'おだやか', skills: ['はなひらき', 'もりの うた'],
    evolutions: [
      { to: 'harujika', level: 5, affection: 20, items: { petal: 6 }, hint: 'はるの はなに つつまれた すがた' },
      { to: 'komorebijika', level: 5, affection: 20, items: { star: 2, clover: 1 }, hint: 'こもれびの ひかりの すがた' },
    ],
    unlock: 'さくらの たまご・ゆめの たまご から うまれる / おかしの まちで であえる', description: 'つのに はなが さいている しか。しずかな もりが すき。',
    look: { body: '#f6d7b8', belly: '#fff6ec', accent: '#ff9ec7', ears: 'antler', tail: 'puff', motif: 'flower' },
  },
  { id: 'harujika', baseId: 'hanajika', name: 'はるじか', animal: 'しか', theme: 'はる', rarity: 3, ability: 'flower',
    baseStats: { power: 16, explore: 21 }, growth: { power: 4, explore: 4 }, favoriteFood: 'strawberry', personality: 'おだやか',
    skills: ['はなひらき', 'はるかぜ'], evolutions: [], unlock: 'はなじかが はなびらで しんか / はなの ていえんで であえる',
    description: 'あるくと まわりが はるに なる しか。',
    look: { body: '#ffe0ec', belly: '#ffffff', accent: '#ff6fae', ears: 'antler', tail: 'puff', motif: 'flower', extra: 'cape', scale: 1.15 } },
  { id: 'komorebijika', baseId: 'hanajika', name: 'こもれびじか', animal: 'しか', theme: 'こもれび', rarity: 3, ability: 'flower', extraAbility: 'light',
    baseStats: { power: 15, explore: 22 }, growth: { power: 4, explore: 4 }, favoriteFood: 'strawberry', personality: 'おだやか',
    skills: ['はなひらき', 'ひだまり'], evolutions: [], unlock: 'はなじかが ほしと クローバーで しんか',
    description: 'つのが ひかりで できている しか。',
    look: { body: '#e6f5c9', belly: '#fffff0', accent: '#ffd84d', ears: 'antler', tail: 'puff', motif: 'leaf', extra: 'halo', scale: 1.15 } },

  // 8. 月 × フクロウ
  {
    id: 'tsukimiho', name: 'つきみほー', animal: 'ふくろう', theme: 'つき', rarity: 2, ability: 'fly',
    baseStats: { power: 10, explore: 15 }, growth: { power: 2, explore: 4 },
    favoriteFood: 'pudding', personality: 'ものしり', skills: ['そらとび', 'つきの ちしき'],
    evolutions: [
      { to: 'mangetsuho', level: 5, affection: 20, items: { star: 3, drop: 1 }, hint: 'まんげつの ように ひかる すがた' },
      { to: 'yumemiho', level: 5, affection: 20, items: { cotton: 3, drop: 1 }, hint: 'ゆめの なかを とぶ すがた' },
    ],
    unlock: 'さくらの たまご・ゆめの たまご から うまれる / うみの せかいの いりえで であえる', description: 'おでこに みかづきの もようが ある ふくろう。なんでも しっている。',
    look: { body: '#cfc3ee', belly: '#fff8e6', accent: '#ffe066', ears: 'tuft', tail: 'none', motif: 'moon' },
  },
  { id: 'mangetsuho', baseId: 'tsukimiho', name: 'まんげつほー', animal: 'ふくろう', theme: 'まんげつ', rarity: 3, ability: 'fly', extraAbility: 'light',
    baseStats: { power: 14, explore: 23 }, growth: { power: 3, explore: 5 }, favoriteFood: 'pudding', personality: 'ものしり',
    skills: ['そらとび', 'まんげつライト'], evolutions: [], unlock: 'つきみほーが ほしと しずくで しんか',
    description: 'まんまるの つきを せおった ふくろう。',
    look: { body: '#fff1c4', belly: '#ffffff', accent: '#ffc94d', ears: 'tuft', tail: 'none', motif: 'moon', extra: 'halo', scale: 1.1 } },
  { id: 'yumemiho', baseId: 'tsukimiho', name: 'ゆめみほー', animal: 'ふくろう', theme: 'ゆめ', rarity: 3, ability: 'fly',
    baseStats: { power: 13, explore: 24 }, growth: { power: 3, explore: 5 }, favoriteFood: 'pudding', personality: 'ものしり',
    skills: ['そらとび', 'ゆめの とびら'], evolutions: [], unlock: 'つきみほーが わたと しずくで しんか / ふしぎな 森で であえる',
    description: 'みんなに すてきな ゆめを はこぶ ふくろう。',
    look: { body: '#ffd6f0', belly: '#f8f0ff', accent: '#b98cff', ears: 'tuft', tail: 'none', motif: 'cloud', extra: 'wings', scale: 1.1 } },

  // 9. リボン × イヌ
  {
    id: 'ribowan', name: 'りぼわん', animal: 'いぬ', theme: 'リボン', rarity: 1, ability: 'power',
    baseStats: { power: 14, explore: 9 }, growth: { power: 4, explore: 2 },
    favoriteFood: 'cookie', personality: 'ひとなつっこい', skills: ['よいしょパワー', 'しっぽ ふりふり'],
    evolutions: [
      { to: 'princesswan', level: 5, affection: 20, items: { petal: 3, star: 2 }, hint: 'おひめさまの ような すがた' },
      { to: 'knightwan', level: 5, affection: 20, items: { shell: 2, cotton: 2 }, hint: 'ナイトの ような すがた' },
    ],
    unlock: 'さくらの たまご・ゆめの たまご から うまれる / おかしの まちで であえる', description: 'みみに おおきな リボンを つけた いぬ。だれとでも すぐ なかよし。',
    look: { body: '#fff0d9', belly: '#ffffff', accent: '#ff7fae', ears: 'round', tail: 'thin', motif: 'ribbon' },
  },
  { id: 'princesswan', baseId: 'ribowan', name: 'プリンセスわん', animal: 'いぬ', theme: 'プリンセス', rarity: 2, ability: 'power', extraAbility: 'flower',
    baseStats: { power: 20, explore: 14 }, growth: { power: 5, explore: 3 }, favoriteFood: 'cookie', personality: 'ひとなつっこい',
    skills: ['よいしょパワー', 'ロイヤルスマイル'], evolutions: [], unlock: 'りぼわんが はなびらと ほしで しんか / プリンセスキャッスルで であえる',
    description: 'ティアラを つけた いぬ。おしろの ぶとうかいが ゆめ。',
    look: { body: '#ffe6f0', belly: '#ffffff', accent: '#ff5fa2', ears: 'round', tail: 'thin', motif: 'ribbon', extra: 'crown', scale: 1.1 } },
  { id: 'knightwan', baseId: 'ribowan', name: 'ナイトわん', animal: 'いぬ', theme: 'ナイト', rarity: 2, ability: 'power', extraAbility: 'water',
    baseStats: { power: 23, explore: 12 }, growth: { power: 5, explore: 3 }, favoriteFood: 'cookie', personality: 'ひとなつっこい',
    skills: ['よいしょパワー', 'まもりの マント'], evolutions: [], unlock: 'りぼわんが かいがらと わたで しんか / プリンセスキャッスルで であえる',
    description: 'マントを なびかせる いぬ。みんなを まもるのが しごと。',
    look: { body: '#e6ecff', belly: '#ffffff', accent: '#6f8cff', ears: 'round', tail: 'thin', motif: 'ribbon', extra: 'cape', scale: 1.1 } },

  // 10. 虹 × ハリネズミ
  {
    id: 'nijihari', name: 'にじはり', animal: 'はりねずみ', theme: 'にじ', rarity: 3, ability: 'light',
    baseStats: { power: 12, explore: 16 }, growth: { power: 3, explore: 4 },
    favoriteFood: 'starcandy', personality: 'わくわく たんけんか', skills: ['にじいろライト', 'ころころ ローリング'],
    evolutions: [
      { to: 'aurorahari', level: 5, affection: 20, items: { star: 3, drop: 2 }, hint: 'オーロラいろの すがた' },
      { to: 'hanabihari', level: 5, affection: 20, items: { petal: 4, star: 2 }, hint: 'はなびの ように きらめく すがた' },
    ],
    unlock: 'ゆめの たまご から まれに うまれる / ほしぞらの しまで であえる', description: 'せなかの はりが にじいろの ハリネズミ。さわると ふわふわ。',
    look: { body: '#ffe9d1', belly: '#fffaf2', accent: '#ff9ec7', ears: 'tiny', tail: 'spiky', motif: 'rainbow' },
  },
  { id: 'aurorahari', baseId: 'nijihari', name: 'オーロラはり', animal: 'はりねずみ', theme: 'オーロラ', rarity: 3, ability: 'light', extraAbility: 'water',
    baseStats: { power: 17, explore: 25 }, growth: { power: 4, explore: 5 }, favoriteFood: 'starcandy', personality: 'わくわく たんけんか',
    skills: ['にじいろライト', 'オーロラベール'], evolutions: [], unlock: 'にじはりが ほしと しずくで しんか / ふしぎな 森で であえる',
    description: 'せなかで オーロラが ゆれる ハリネズミ。',
    look: { body: '#d4f5ec', belly: '#ffffff', accent: '#b98cff', ears: 'tiny', tail: 'spiky', motif: 'rainbow', extra: 'halo', scale: 1.15 } },
  { id: 'hanabihari', baseId: 'nijihari', name: 'はなびはり', animal: 'はりねずみ', theme: 'はなび', rarity: 3, ability: 'light', extraAbility: 'power',
    baseStats: { power: 20, explore: 22 }, growth: { power: 5, explore: 4 }, favoriteFood: 'starcandy', personality: 'わくわく たんけんか',
    skills: ['にじいろライト', 'ぱちぱち はなび'], evolutions: [], unlock: 'にじはりが はなびらと ほしで しんか',
    description: 'よろこぶと せなかで はなびが はじける ハリネズミ。',
    look: { body: '#ffd9e8', belly: '#fff8fb', accent: '#ffcf4d', ears: 'tiny', tail: 'spiky', motif: 'star', extra: 'crown', scale: 1.15 } },

  // 11. 雪 × ペンギン
  {
    id: 'yukipen', name: 'ゆきぺん', animal: 'ぺんぎん', theme: 'ゆき', rarity: 2, ability: 'water',
    baseStats: { power: 12, explore: 13 }, growth: { power: 3, explore: 3 },
    favoriteFood: 'fishjelly', personality: 'がんばりや', skills: ['みずさがし', 'ゆきあそび'],
    evolutions: [
      { to: 'koripen', level: 5, affection: 20, items: { shell: 2, drop: 2 }, hint: 'こおりの よろいの すがた' },
      { to: 'snowpen', level: 5, affection: 20, items: { cotton: 3, star: 1 }, hint: 'ゆきの けっしょうの すがた' },
    ],
    unlock: 'さくらの たまご・ゆめの たまご から うまれる / うみの せかいの なみうちぎわで であえる', description: 'あたまに ゆきの けっしょうを のせた ペンギン。すべるのが とくい。',
    look: { body: '#a9c8f0', belly: '#ffffff', accent: '#ffb3d1', ears: 'none', tail: 'none', motif: 'snow' },
  },
  { id: 'koripen', baseId: 'yukipen', name: 'こおりぺん', animal: 'ぺんぎん', theme: 'こおり', rarity: 3, ability: 'water', extraAbility: 'power',
    baseStats: { power: 20, explore: 18 }, growth: { power: 5, explore: 3 }, favoriteFood: 'fishjelly', personality: 'がんばりや',
    skills: ['みずさがし', 'こおりの かべ'], evolutions: [], unlock: 'ゆきぺんが かいがらと しずくで しんか',
    description: 'こおりの マントを まとった ペンギン。',
    look: { body: '#8fd0f0', belly: '#f2fdff', accent: '#4f9fe8', ears: 'none', tail: 'none', motif: 'snow', extra: 'cape', scale: 1.1 } },
  { id: 'snowpen', baseId: 'yukipen', name: 'スノーぺん', animal: 'ぺんぎん', theme: 'ゆきの けっしょう', rarity: 3, ability: 'water', extraAbility: 'fly',
    baseStats: { power: 16, explore: 22 }, growth: { power: 4, explore: 4 }, favoriteFood: 'fishjelly', personality: 'がんばりや',
    skills: ['みずさがし', 'ゆきの はね'], evolutions: [], unlock: 'ゆきぺんが わたと ほしで しんか',
    description: 'ゆきの はねで すこしだけ とべる ペンギン。',
    look: { body: '#e8f2ff', belly: '#ffffff', accent: '#9fc8ff', ears: 'none', tail: 'none', motif: 'snow', extra: 'wings', scale: 1.1 } },

  // 12. 魔法 × ハムスター
  {
    id: 'mahoham', name: 'まほハム', animal: 'はむすたー', theme: 'まほう', rarity: 3, ability: 'fly',
    baseStats: { power: 11, explore: 17 }, growth: { power: 3, explore: 4 },
    favoriteFood: 'nutcake', personality: 'いたずらずき', skills: ['ふわふわ まほう', 'ほっぺ ぶくろ'],
    evolutions: [
      { to: 'majoham', level: 5, affection: 20, items: { drop: 3, star: 2 }, hint: 'まじょの ぼうしの すがた' },
      { to: 'houkiham', level: 5, affection: 20, items: { cotton: 2, petal: 3 }, hint: 'ほうきに のった すがた' },
    ],
    unlock: 'しずく5こ・ほし5こ・わた3こ で よびかける / ゆめの たまご / プリンセスキャッスルで であえる', craft: { drop: 5, star: 5, cotton: 3 },
    description: 'ちいさな まほうの つえを もつ ハムスター。まほうは まだ れんしゅうちゅう。',
    look: { body: '#ffe2b8', belly: '#ffffff', accent: '#b98cff', ears: 'round', tail: 'none', motif: 'magic' },
  },
  { id: 'majoham', baseId: 'mahoham', name: 'まじょハム', animal: 'はむすたー', theme: 'まじょ', rarity: 3, ability: 'fly', extraAbility: 'light',
    baseStats: { power: 15, explore: 25 }, growth: { power: 3, explore: 5 }, favoriteFood: 'nutcake', personality: 'いたずらずき',
    skills: ['ふわふわ まほう', 'ほしの じゅもん'], evolutions: [], unlock: 'まほハムが しずくと ほしで しんか / ふしぎな 森で であえる',
    description: 'とんがりぼうしを かぶった ハムスター。じゅもんが ちょっぴり じょうずに なった。',
    look: { body: '#e6d2ff', belly: '#ffffff', accent: '#ffcf4d', ears: 'round', tail: 'none', motif: 'magic', extra: 'halo', scale: 1.1 } },
  { id: 'houkiham', baseId: 'mahoham', name: 'ほうきハム', animal: 'はむすたー', theme: 'ほうき', rarity: 3, ability: 'fly', extraAbility: 'flower',
    baseStats: { power: 14, explore: 26 }, growth: { power: 3, explore: 5 }, favoriteFood: 'nutcake', personality: 'いたずらずき',
    skills: ['ふわふわ まほう', 'はなの ほうき'], evolutions: [], unlock: 'まほハムが わたと はなびらで しんか',
    description: 'はなの ほうきで そらを とぶ ハムスター。',
    look: { body: '#ffd9c4', belly: '#fffaf0', accent: '#ff8fbf', ears: 'round', tail: 'none', motif: 'flower', extra: 'wings', scale: 1.1 } },
];

// 進化先は 姿そのものが かわる（Creature.tsx / CreatureIcon が stage を見る）
for (const s of SPECIES) if (s.baseId) s.look.stage = 2;

const SPECIES_MAP = new Map(SPECIES.map((s) => [s.id, s]));

export function getSpecies(id: string): Species {
  const s = SPECIES_MAP.get(id);
  if (!s) throw new Error(`unknown species: ${id}`);
  return s;
}
export function hasSpecies(id: string): boolean {
  return SPECIES_MAP.has(id);
}
export const BASE_SPECIES = SPECIES.filter((s) => !s.baseId);

/** 図鑑の並び順: 基本の なかま → その進化先 */
export const DEX_ORDER: Species[] = BASE_SPECIES.flatMap((b) => [b, ...SPECIES.filter((s) => s.baseId === b.id)]);

export function abilitiesOf(s: Species): Ability[] {
  return s.extraAbility ? [s.ability, s.extraAbility] : [s.ability];
}
