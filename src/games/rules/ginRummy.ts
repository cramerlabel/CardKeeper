import { DEFAULT_SCORING_CONFIG as c } from '../ginRummy/engine/config';
import type { GameRules } from './types';

export const ginRummyRules: GameRules = {
  summary: `Two players race to turn their cards into sets and runs. Score points by going out with less leftover (deadwood) than your opponent; the first to ${c.targetScore} points ends the game.`,
  quickFacts: ['2 players', '52-card deck', 'Ace low', `First to ${c.targetScore}`],
  sections: [
    {
      title: 'Goal',
      paragraphs: [
        'Arrange your 10 cards into melds so that as few unmatched cards (deadwood) as possible are left over, then knock or go gin to end the hand.',
      ],
    },
    {
      title: 'Card values',
      bullets: [
        'Aces are low and count 1 point.',
        'Number cards count their face value.',
        'Jacks, queens and kings count 10 each.',
      ],
    },
    {
      title: 'Melds',
      bullets: [
        'Set: three or four cards of the same rank, such as three 7s.',
        'Run: three or more cards of the same suit in sequence, such as the 4, 5 and 6 of spades. Aces are low only, so A-2-3 is a run but Q-K-A is not.',
        'Deadwood: any card that is not part of a meld.',
      ],
    },
    {
      title: 'How a hand is played',
      bullets: [
        'Deal 10 cards to each player. Turn one card face up beside the stock to start the discard pile.',
        'On your turn, draw the top card of the stock or the discard pile, then discard one card.',
        `You may knock when your deadwood is ${c.maxKnockDeadwood} points or fewer. Lay down your melds and deadwood.`,
        'The opponent may lay off their deadwood cards onto the knocker\u2019s melds, which lowers their deadwood. No lay-off is allowed against a gin.',
        'Going gin means all 10 cards are melded, so you have 0 deadwood. Big gin means all 11 cards are melded before discarding.',
      ],
    },
    {
      title: 'Scoring a hand',
      paragraphs: [
        'Enter each player\u2019s deadwood after lay-offs. The app works out who wins the hand and the points.',
      ],
      scoring: [
        { label: 'Knock (knocker has less)', value: 'Difference in deadwood' },
        { label: 'Gin', value: `${c.ginBonus} + opponent\u2019s deadwood` },
        { label: 'Big gin', value: `${c.bigGinBonus} + opponent\u2019s deadwood` },
        {
          label: 'Undercut (opponent has equal or less)',
          value: `Opponent scores ${c.undercutBonus} + the difference`,
        },
      ],
    },
    {
      title: 'Winning the game',
      bullets: [
        `The game ends when a player\u2019s running total reaches ${c.targetScore} or more.`,
        `The winner gets a ${c.gameBonus} point game bonus, or ${c.shutoutGameBonus} if the opponent won no hands (a shutout).`,
        `Each player also earns a ${c.boxBonus} point box bonus for every hand they won.`,
        'Final scores are the running totals plus those bonuses; the higher final score wins.',
      ],
    },
  ],
};
