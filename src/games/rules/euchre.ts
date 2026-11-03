import type { GameRules } from './types';

export const euchreRules: GameRules = {
  summary:
    'A fast partnership trick-taking game played with a short deck. One team picks the trump suit and tries to win at least three of the five tricks.',
  quickFacts: ['4 players', '2 teams', '24-card deck', 'First to 10'],
  sections: [
    {
      title: 'Goal',
      paragraphs: ['Partners sit across from each other. The first team to score 10 points wins.'],
    },
    {
      title: 'Setup',
      bullets: [
        'Use only the 9, 10, J, Q, K and A of each suit (24 cards).',
        'Deal five cards to each player, then turn one card of the remaining kitty face up.',
      ],
    },
    {
      title: 'Choosing trump',
      bullets: [
        'Starting left of the dealer, each player may \u201corder up\u201d the turned-up card\u2019s suit as trump, or pass.',
        'If everyone passes, a second round lets players name any other suit as trump, or pass.',
        'The team that names trump are the \u201cmakers\u201d. A maker may also \u201cgo alone\u201d, playing without their partner for bigger points.',
      ],
    },
    {
      title: 'Card ranking',
      bullets: [
        'In trump: right bower (jack of trump) is highest, then left bower (the other jack of the same colour), then A, K, Q, 10, 9.',
        'In other suits: A, K, Q, J, 10, 9. The left bower counts as trump, not its printed suit.',
      ],
    },
    {
      title: 'Playing a hand',
      bullets: [
        'The player left of the dealer leads. You must follow suit if you can; otherwise play any card.',
        'The highest trump wins the trick, or the highest card of the suit led if no trump was played. The winner leads next.',
        'Play all five tricks.',
      ],
    },
    {
      title: 'Scoring a hand',
      scoring: [
        { label: 'Makers win 3 or 4 tricks', value: '1 point' },
        { label: 'Makers win all 5 tricks', value: '2 points' },
        { label: 'Lone hand wins all 5 tricks', value: '4 points' },
        { label: 'Lone hand wins 3 or 4 tricks', value: '1 point' },
        { label: 'Makers win fewer than 3 (euchred)', value: '2 points to defenders' },
      ],
    },
    {
      title: 'Winning the game',
      bullets: ['The first team to reach 10 points wins.'],
    },
  ],
};
