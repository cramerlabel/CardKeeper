import {
  ERROR_HEELS_POINTS,
  ERROR_POINTS_RANGE,
  HEELS_POINTS,
  MAX_EVENT_POINTS,
  SCORE_KINDS,
  computeResult,
  computeTotals,
  rebuildEvents,
  validateScore,
  type GameContext,
  type PlayerIndex,
  type ScoreEntry,
  type ScoreEvent,
  type ScoreInput,
  type ScoreKind,
} from '@/games/cribbage/engine';

export interface ScoreForm {
  player: PlayerIndex;
  kind: ScoreKind;
  /** Typed digits; '' when nothing has been entered yet. */
  pointsText: string;
}

/** The chosen player's total after the score is saved. */
export interface ScorePreview {
  before: number;
  after: number;
  wins: boolean;
  /** Later events an edit would permanently remove because the game would end sooner. */
  dropped: number;
}

export type MessageTone = 'neutral' | 'ok' | 'error';

export interface ScoreMessage {
  tone: MessageTone;
  lines: string[];
  notes: string[];
}

const PREVIEW_ID = 'preview';

export const WINS_NOTE = 'Wins the game!';

const PEGGING_QUICK = [1, 2, 3, 4, 6, 12] as const;
const COUNT_QUICK = [4, 6, 8, 12, 16, 20] as const;

export const HEELS_NOTE = `His heels is always ${HEELS_POINTS} points, for the dealer.`;

/** Common values for the one-row shortcut buttons (none for heels, which is always 2). */
export function quickPointsFor(kind: ScoreKind): readonly number[] {
  if (kind === 'heels') return [];
  return kind === 'hand' || kind === 'crib' ? COUNT_QUICK : PEGGING_QUICK;
}

/** Crib and his heels can only be scored by the dealer. */
export const isDealerOnly = (kind: ScoreKind): boolean => kind === 'crib' || kind === 'heels';

export const kindLabel = (kind: ScoreKind): string =>
  SCORE_KINDS.find((k) => k.kind === kind)?.label ?? kind;

/** Hint for a kind; dealer-only kinds name the dealer. */
export function kindHint(kind: ScoreKind, dealerName: string): string {
  const hint = SCORE_KINDS.find((k) => k.kind === kind)?.hint ?? '';
  return isDealerOnly(kind) ? `${hint} · dealer: ${dealerName}` : hint;
}

/** Whole number of 1–2 digits, or null when the text is empty or not a number. */
export function parsePoints(text: string): number | null {
  return /^\d{1,2}$/.test(text) ? Number(text) : null;
}

/**
 * Appends a digit. A digit that would push the value over the maximum starts a new number
 * (so a quick button followed by a digit replaces it); a stray zero is ignored instead.
 */
export function appendDigit(text: string, digit: string): string {
  const next = text === '0' ? digit : text + digit;
  if (Number(next) <= MAX_EVENT_POINTS) return next;
  return digit === '0' ? text : digit;
}

export const removeLastDigit = (text: string): string => text.slice(0, -1);

/** Engine input for the form; empty or unreadable points become NaN so validation rejects them. */
export function toInput(form: ScoreForm, deal: number): ScoreInput {
  return {
    player: form.player,
    kind: form.kind,
    points: parsePoints(form.pointsText) ?? NaN,
    deal,
  };
}

/** Validates with the engine. Nothing is said about points until some have been typed. */
export function errorsFor(form: ScoreForm, deal: number, ctx: GameContext): string[] {
  const errors = validateScore(toInput(form, deal), ctx);
  if (form.pointsText !== '') return errors;
  return errors.filter((e) => e !== ERROR_POINTS_RANGE && e !== ERROR_HEELS_POINTS);
}

/** Add mode starts with the player left of the dealer (who leads the play); edit mode with the event. */
export function initialFormFor(
  event: ScoreEvent | undefined,
  dealer: PlayerIndex,
  playerCount: number,
  preselected: PlayerIndex | null = null,
): ScoreForm {
  if (event) {
    return { player: event.player, kind: event.kind, pointsText: String(event.points) };
  }
  return {
    player: preselected ?? (((dealer + 1) % playerCount) as PlayerIndex),
    kind: 'pegging',
    pointsText: '',
  };
}

/** Heels is always 2 points for the dealer; the crib is always the dealer's. */
export function changeKind(form: ScoreForm, kind: ScoreKind, dealer: PlayerIndex): ScoreForm {
  if (kind === 'heels') {
    return { player: dealer, kind, pointsText: String(HEELS_POINTS) };
  }
  return { ...form, kind, player: kind === 'crib' ? dealer : form.player };
}

export const isDirty = (form: ScoreForm, baseline: ScoreForm): boolean =>
  form.player !== baseline.player ||
  form.kind !== baseline.kind ||
  form.pointsText !== baseline.pointsText;

/** Reads the `?player=` route param; null when missing or not a player of this game. */
export function parsePlayerParam(
  raw: string | string[] | undefined,
  playerCount: number,
): PlayerIndex | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined || !/^\d$/.test(value)) return null;
  const player = Number(value);
  return player < playerCount ? (player as PlayerIndex) : null;
}

/** Events as the store would rebuild them after adding the form (or replacing `editing` with it). */
function simulate(
  events: readonly ScoreEvent[],
  form: ScoreForm,
  deal: number,
  ctx: GameContext,
  editing?: ScoreEvent,
): ScoreEvent[] | null {
  if (parsePoints(form.pointsText) === null || errorsFor(form, deal, ctx).length > 0) return null;
  const input = toInput(form, deal);
  const entries: ScoreEntry[] = events.map(({ id, player, kind, points, deal: d }) => ({
    id,
    input: { player, kind, points, deal: d },
  }));
  const index = editing ? entries.findIndex((e) => e.id === editing.id) : -1;
  if (index >= 0) entries[index] = { id: entries[index].id, input };
  else entries.push({ id: PREVIEW_ID, input });
  try {
    return rebuildEvents(entries, ctx);
  } catch {
    return null;
  }
}

/**
 * The chosen player's total now and after saving, whether that wins the game, and how many later
 * events an edit would drop. Null until the form is valid.
 */
export function previewTotals(
  events: readonly ScoreEvent[],
  form: ScoreForm,
  deal: number,
  ctx: GameContext,
  editing?: ScoreEvent,
): ScorePreview | null {
  const next = simulate(events, form, deal, ctx, editing);
  if (!next) return null;
  return {
    before: computeTotals(events, ctx)[form.player],
    after: computeTotals(next, ctx)[form.player],
    wins: computeResult(next, ctx).winner === form.player,
    dropped: editing ? Math.max(0, events.length - next.length) : 0,
  };
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function describeDropped(count: number): string {
  return `${plural(count, 'later score')} will be permanently removed because the game ends sooner.`;
}

/** What the readout box says: store/engine errors first, then the preview, else a prompt. */
export function buildMessage(options: {
  errors: readonly string[];
  saveErrors: readonly string[];
  preview: ScorePreview | null;
  playerName: string;
  notice?: string | null;
}): ScoreMessage {
  const { errors, saveErrors, preview, playerName, notice } = options;
  if (saveErrors.length > 0) return { tone: 'error', lines: [...saveErrors], notes: [] };
  if (errors.length > 0) return { tone: 'error', lines: [...errors], notes: [] };
  if (!preview) {
    return { tone: 'neutral', lines: [notice ?? `Enter points for ${playerName}`], notes: [] };
  }
  const notes: string[] = [];
  if (preview.wins) notes.push(WINS_NOTE);
  if (preview.dropped > 0) notes.push(describeDropped(preview.dropped));
  return {
    tone: 'ok',
    lines: [`${playerName}: ${preview.before} → ${preview.after}`],
    notes,
  };
}

/** "Alice +6 (Hand)" */
export function describeScore(event: ScoreInput, names: readonly string[]): string {
  return `${names[event.player]} +${event.points} (${kindLabel(event.kind)})`;
}
