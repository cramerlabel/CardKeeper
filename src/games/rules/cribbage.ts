import { HEELS_POINTS, MAX_EVENT_POINTS, SHORT_CONFIG, STANDARD_CONFIG } from '../cribbage/engine';
import type { GameRules } from './types';

const { target, skunkLine, doubleSkunkLine } = STANDARD_CONFIG;
const short = SHORT_CONFIG;

export const cribbageRules: GameRules = {
  summary: `Players score points for card combinations and move pegs around a board. The first to reach ${target} holes wins, or ${short.target} in a short game.`,
  quickFacts: ['2–3 players', '52-card deck', 'Peg on a board', `First to ${target}`],
  sections: [
    {
      title: 'Goal',
      paragraphs: [
        `Be the first player to peg ${target} points (${short.target} in a short game). Points come from the play and from counting your hand and the crib.`,
      ],
    },
    {
      title: 'The deal & the crib',
      bullets: [
        'The dealer rotates every deal. Two players get six cards each; three players get five cards each, plus one card dealt to the crib.',
        'Each player discards to the crib so that everyone keeps four cards (two players discard two, three players discard one).',
        'The crib belongs to the dealer and is counted after the dealer\u2019s hand.',
        'The player to the dealer\u2019s left cuts the deck and the dealer turns up the starter card.',
        `If the starter is a jack, the dealer scores ${HEELS_POINTS} points for his heels.`,
      ],
    },
    {
      title: 'The play (pegging)',
      paragraphs: [
        'Starting left of the dealer, players take turns laying a card face up and announcing the running total. The total may not go over 31. Face cards count 10, aces count 1.',
      ],
      scoring: [
        { label: 'Total of 15', value: '2' },
        { label: 'Total of 31', value: '2' },
        { label: 'Go (last card played)', value: '1' },
        { label: 'Pair', value: '2' },
        { label: 'Three of a kind', value: '6' },
        { label: 'Four of a kind', value: '12' },
        { label: 'Run of 3 or more', value: '1 per card' },
      ],
    },
    {
      title: 'The show',
      paragraphs: [
        'After the play, each player counts their four cards together with the starter, starting left of the dealer. The dealer counts last, then counts the crib.',
      ],
      scoring: [
        { label: 'Each combination totalling 15', value: '2' },
        { label: 'Each pair', value: '2' },
        { label: 'Each run of 3 or more', value: '1 per card' },
        { label: 'Four-card flush in hand', value: '4' },
        { label: 'Five-card flush (with starter)', value: '5' },
        { label: 'His nobs (jack matching the starter suit)', value: '1' },
        { label: 'His heels (jack as starter, dealer)', value: String(HEELS_POINTS) },
        { label: 'Best possible hand', value: String(MAX_EVENT_POINTS) },
      ],
    },
    {
      title: 'Special rules',
      bullets: [
        'A flush in the crib only counts when all five cards, including the starter, are the same suit.',
        'A card used in several combinations scores for each one.',
      ],
    },
    {
      title: 'Skunks',
      bullets: [
        `A skunk is a win where the loser finishes with fewer than ${skunkLine} points.`,
        `A double skunk is a win where the loser finishes with fewer than ${doubleSkunkLine} points.`,
        `In a short game the skunk line is at ${short.skunkLine} and there is no double skunk.`,
        'With three players, each loser is checked against the lines separately.',
      ],
      scoring: [
        { label: 'Skunk line', value: `${skunkLine} (${short.skunkLine} short game)` },
        { label: 'Double skunk line', value: `${doubleSkunkLine} (short game: none)` },
      ],
    },
    {
      title: 'Winning the game',
      bullets: [
        `The game ends the moment a player pegs out at ${target} points (${short.target} in a short game).`,
        'That player wins immediately, even in the middle of the play or the show.',
        'Each player moves two pegs, a front and a back peg, leapfrogging them along the board.',
      ],
    },
    {
      title: 'Using Card Keeper',
      bullets: [
        'Tap a player and enter the points as you score them, then choose pegging, hand, crib, his heels or other.',
        'Every score is logged in the history. Tap an entry to edit or delete it, or undo the last one.',
        'The board shows each player\u2019s front and back peg and moves them for you.',
        'The dealer and crib are tracked and rotate every deal.',
      ],
    },
  ],
};
