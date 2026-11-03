import type { GameRules } from './types';

export const heartsRules: GameRules = {
  summary:
    'A trick-taking game where you try to avoid points. Hearts and the queen of spades are bad; the lowest score when someone reaches 100 wins.',
  quickFacts: ['4 players', '52-card deck', 'Lowest score wins', 'Game to 100'],
  sections: [
    {
      title: 'Goal',
      paragraphs: [
        'Take as few penalty cards as possible. Every player plays for themselves. The game ends when anyone reaches 100 points, and the player with the lowest total wins.',
      ],
    },
    {
      title: 'Setup',
      bullets: [
        'Deal 13 cards to each player.',
        'Before play, each player passes three cards face down to another player: left on hand 1, right on hand 2, across on hand 3, and no pass on hand 4. Then the cycle repeats.',
        'Cards rank from ace (high) down to 2. There is no trump suit.',
      ],
    },
    {
      title: 'Playing a hand',
      bullets: [
        'The player holding the 2 of clubs leads it to the first trick.',
        'Play goes clockwise. You must follow the suit led if you can; otherwise you may play any card.',
        'The highest card of the suit led wins the trick and that player leads the next one.',
        'Hearts cannot be led until a heart has been played (\u201cbroken\u201d), unless a player has only hearts.',
        'On the first trick, you cannot play a heart or the queen of spades if you can follow suit or play another card.',
      ],
    },
    {
      title: 'Scoring a hand',
      scoring: [
        { label: 'Each heart taken', value: '1 point' },
        { label: 'Queen of spades', value: '13 points' },
        { label: 'Total points per hand', value: '26 points' },
      ],
    },
    {
      title: 'Shooting the moon',
      paragraphs: [
        'If one player takes all 13 hearts and the queen of spades, that player scores 0 and every other player scores 26 (some groups instead subtract 26 from the shooter).',
      ],
    },
    {
      title: 'Winning the game',
      bullets: [
        'Add each hand\u2019s points to the running totals.',
        'When any player reaches 100 or more, the game ends and the lowest total wins.',
      ],
    },
  ],
};
