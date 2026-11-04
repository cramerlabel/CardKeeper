import type {
  GameContext,
  GameResult,
  PegPosition,
  PlayerIndex,
  ScoreEvent,
  SkunkLevel,
} from './types';

/** Per-player totals, capped at the target. */
export function computeTotals(events: readonly ScoreEvent[], ctx: GameContext): number[] {
  const totals: number[] = Array.from({ length: ctx.playerCount }, () => 0);
  for (const event of events) totals[event.player] += event.points;
  return totals.map((total) => Math.min(total, ctx.config.target));
}

export function isGameOver(events: readonly ScoreEvent[], ctx: GameContext): boolean {
  return computeTotals(events, ctx).some((total) => total >= ctx.config.target);
}

function skunkLevel(total: number, ctx: GameContext): SkunkLevel {
  const { skunkLine, doubleSkunkLine } = ctx.config;
  if (doubleSkunkLine !== null && total < doubleSkunkLine) return 'doubleSkunk';
  if (total < skunkLine) return 'skunk';
  return 'none';
}

export function computeResult(events: readonly ScoreEvent[], ctx: GameContext): GameResult {
  const totals = computeTotals(events, ctx);

  const running: number[] = Array.from({ length: ctx.playerCount }, () => 0);
  let winner: PlayerIndex | null = null;
  for (const event of events) {
    running[event.player] += event.points;
    if (running[event.player] >= ctx.config.target) {
      winner = event.player;
      break;
    }
  }

  if (winner === null) {
    return { winner, totals, skunk: totals.map(() => 'none' as const), margin: 0 };
  }

  const skunk = totals.map((total, player) =>
    player === winner ? 'none' : skunkLevel(total, ctx),
  );
  const bestOpponent = Math.max(...totals.filter((_, player) => player !== winner));
  return { winner, totals, skunk, margin: totals[winner] - bestOpponent };
}

/** Front peg = current total; back peg = total before the player's most recent event. */
export function pegPositions(events: readonly ScoreEvent[], ctx: GameContext): PegPosition[] {
  const target = ctx.config.target;
  const front: number[] = Array.from({ length: ctx.playerCount }, () => 0);
  const back: number[] = Array.from({ length: ctx.playerCount }, () => 0);
  for (const event of events) {
    back[event.player] = front[event.player];
    front[event.player] = Math.min(front[event.player] + event.points, target);
  }
  return front.map((value, player) => ({ front: value, back: back[player] }));
}
