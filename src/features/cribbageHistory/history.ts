import {
  dealerOf,
  type PlayerCount,
  type PlayerIndex,
  type ScoreEvent,
  type ScoreKind,
} from '@/games/cribbage/engine';
import { describeScore, kindLabel } from '@/features/scoreEntry/scoreEntry';

export interface HistoryRow {
  id: string;
  /** 1-based order within the game. */
  number: number;
  deal: number;
  player: PlayerIndex;
  playerName: string;
  kind: ScoreKind;
  kindLabel: string;
  points: number;
  /** The scoring player's running total after this score (capped at the target). */
  total: number;
  /** "Bob +6 (Hand)" */
  description: string;
}

export interface HistorySection {
  deal: number;
  dealerName: string;
  isCurrent: boolean;
  /** Newest first. */
  rows: HistoryRow[];
}

export interface HistoryInput {
  /** Events in play order. */
  events: readonly ScoreEvent[];
  players: readonly string[];
  firstDealer: PlayerIndex;
  /** The deal in progress; always gets a section, even before anything is scored in it. */
  deal: number;
  target: number;
}

/**
 * Score events grouped by deal, newest deal first and newest score first. Deals without scores
 * are omitted, except the current deal.
 */
export function buildHistorySections({
  events,
  players,
  firstDealer,
  deal,
  target,
}: HistoryInput): HistorySection[] {
  const totals = players.map(() => 0);
  const byDeal = new Map<number, HistoryRow[]>();

  for (const event of events) {
    totals[event.player] = Math.min(totals[event.player] + event.points, target);
    const row: HistoryRow = {
      id: event.id,
      number: event.number,
      deal: event.deal,
      player: event.player,
      playerName: players[event.player],
      kind: event.kind,
      kindLabel: kindLabel(event.kind),
      points: event.points,
      total: totals[event.player],
      description: describeScore(event, players),
    };
    const rows = byDeal.get(event.deal);
    if (rows) rows.unshift(row);
    else byDeal.set(event.deal, [row]);
  }

  if (!byDeal.has(deal)) byDeal.set(deal, []);

  return [...byDeal.entries()]
    .sort(([a], [b]) => b - a)
    .map(([sectionDeal, rows]) => ({
      deal: sectionDeal,
      dealerName: players[dealerOf(sectionDeal, firstDealer, players.length as PlayerCount)],
      isCurrent: sectionDeal === deal,
      rows,
    }));
}

/** True when at least one score was recorded in the given deal. */
export const hasScoresInDeal = (events: readonly ScoreEvent[], deal: number): boolean =>
  events.some((event) => event.deal === deal);

export type HistoryListItem =
  | { type: 'header'; key: string; section: HistorySection }
  | { type: 'row'; key: string; row: HistoryRow }
  | { type: 'empty'; key: string; deal: number };

/** Flat list data for a virtualised list: a header per deal, then its rows (or an empty note). */
export function flattenHistory(sections: readonly HistorySection[]): HistoryListItem[] {
  return sections.flatMap<HistoryListItem>((section) => [
    { type: 'header', key: `deal-${section.deal}`, section },
    ...(section.rows.length === 0
      ? [{ type: 'empty' as const, key: `empty-${section.deal}`, deal: section.deal }]
      : section.rows.map((row) => ({ type: 'row' as const, key: row.id, row }))),
  ]);
}

/** Player with the strictly highest total, or null when tied for the lead (including 0-0-0). */
export function leaderOf(totals: readonly number[]): PlayerIndex | null {
  const best = Math.max(...totals);
  if (best <= 0) return null;
  const leaders = totals.flatMap((total, index) => (total === best ? [index] : []));
  return leaders.length === 1 ? (leaders[0] as PlayerIndex) : null;
}
