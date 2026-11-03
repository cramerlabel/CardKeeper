import type { GameRules } from './types';

export const spadesRules: GameRules = {
  summary:
    'A partnership trick-taking game with spades as permanent trump. Bid how many tricks your team will take, then try to make at least that many.',
  quickFacts: ['4 players', '2 teams', '52-card deck', 'Spades are trump'],
  sections: [
    {
      title: 'Goal',
      paragraphs: [
        'Partners sit across from each other and combine their bids and tricks. The first team to reach 500 points wins.',
      ],
    },
    {
      title: 'Setup',
      bullets: [
        'Deal all 52 cards, 13 to each player.',
        'Cards rank from ace (high) down to 2. Spades beat every other suit.',
      ],
    },
    {
      title: 'Bidding',
      bullets: [
        'Each player bids how many tricks they expect to win, from 0 to 13. A team\u2019s bid is the sum of the partners\u2019 bids.',
        'A bid of 0 is called Nil: the player promises to win no tricks.',
      ],
    },
    {
      title: 'Playing a hand',
      bullets: [
        'The player left of the dealer leads. Play goes clockwise and you must follow suit if you can.',
        'If you cannot follow suit you may play any card, including a spade.',
        'The highest spade wins the trick, or the highest card of the suit led if no spades were played. The winner leads next.',
        'Spades cannot be led until a spade has been played (\u201cbroken\u201d), unless a player has only spades.',
      ],
    },
    {
      title: 'Scoring a hand',
      scoring: [
        { label: 'Making your bid', value: '10 points per bid trick' },
        { label: 'Each extra trick (bag)', value: '1 point' },
        { label: 'Collecting 10 bags', value: '\u2212100 points' },
        { label: 'Missing your bid', value: '\u221210 points per bid trick' },
        { label: 'Nil made', value: '+100 points' },
        { label: 'Nil failed', value: '\u2212100 points' },
      ],
    },
    {
      title: 'Winning the game',
      bullets: [
        'Add each hand\u2019s score to the running totals.',
        'The first team to reach 500 points wins. A team that falls to \u2212200 loses.',
        'If both teams pass 500 in the same hand, the higher score wins.',
      ],
    },
  ],
};
