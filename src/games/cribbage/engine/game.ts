import { HEELS_POINTS, MAX_EVENT_POINTS } from './config';
import type {
  GameContext,
  PlayerCount,
  PlayerIndex,
  ScoreEntry,
  ScoreEvent,
  ScoreInput,
} from './types';

export class InvalidScoreError extends Error {
  readonly errors: string[];

  constructor(errors: string[]) {
    super(errors.join(' '));
    this.name = 'InvalidScoreError';
    this.errors = errors;
  }
}

/** Dealer of deal `deal` (1-based); the deal passes to the next player each time. */
export function dealerOf(
  deal: number,
  firstDealer: PlayerIndex,
  playerCount: PlayerCount,
): PlayerIndex {
  const offset = (((deal - 1) % playerCount) + playerCount) % playerCount;
  return ((firstDealer + offset) % playerCount) as PlayerIndex;
}

export const ERROR_POINTS_RANGE = `Points must be a whole number from 1 to ${MAX_EVENT_POINTS}.`;
export const ERROR_PLAYER_RANGE = 'Choose a valid player.';
export const ERROR_DEAL = 'Deal must be a whole number of 1 or more.';
export const ERROR_HEELS_POINTS = `His heels is always ${HEELS_POINTS} points.`;
export const ERROR_HEELS_DEALER = 'Only the dealer scores his heels.';
export const ERROR_CRIB_DEALER = 'Only the dealer scores the crib.';

/** Returns every problem with the input; an empty array means it is valid. */
export function validateScore(input: ScoreInput, ctx: GameContext): string[] {
  const errors: string[] = [];
  const { player, kind, points, deal } = input;

  if (!Number.isInteger(points) || points < 1 || points > MAX_EVENT_POINTS) {
    errors.push(ERROR_POINTS_RANGE);
  }
  const playerValid = Number.isInteger(player) && player >= 0 && player < ctx.playerCount;
  if (!playerValid) errors.push(ERROR_PLAYER_RANGE);
  const dealValid = Number.isInteger(deal) && deal >= 1;
  if (!dealValid) errors.push(ERROR_DEAL);

  if (kind === 'heels' && points !== HEELS_POINTS) errors.push(ERROR_HEELS_POINTS);
  if (playerValid && dealValid) {
    const isDealer = dealerOf(deal, ctx.firstDealer, ctx.playerCount) === player;
    if (kind === 'heels' && !isDealer) errors.push(ERROR_HEELS_DEALER);
    if (kind === 'crib' && !isDealer) errors.push(ERROR_CRIB_DEALER);
  }
  return errors;
}

export function createScoreEvent(
  id: string,
  number: number,
  input: ScoreInput,
  ctx: GameContext,
): ScoreEvent {
  const errors = validateScore(input, ctx);
  if (errors.length > 0) throw new InvalidScoreError(errors);
  return { ...input, id, number };
}

/**
 * Recomputes events from entries in order, renumbering from 1. Stops after the event that
 * brings a player to the target, dropping anything later. Throws on an invalid entry.
 */
export function rebuildEvents(entries: readonly ScoreEntry[], ctx: GameContext): ScoreEvent[] {
  const events: ScoreEvent[] = [];
  const totals: number[] = Array.from({ length: ctx.playerCount }, () => 0);
  for (const entry of entries) {
    const event = createScoreEvent(entry.id, events.length + 1, entry.input, ctx);
    events.push(event);
    totals[event.player] += event.points;
    if (totals[event.player] >= ctx.config.target) break;
  }
  return events;
}
