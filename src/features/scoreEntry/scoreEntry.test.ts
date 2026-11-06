import {
  ERROR_CRIB_DEALER,
  ERROR_HEELS_DEALER,
  ERROR_HEELS_POINTS,
  ERROR_PLAYER_RANGE,
  ERROR_POINTS_RANGE,
  STANDARD_CONFIG,
  SHORT_CONFIG,
  rebuildEvents,
  validateScore,
  type GameContext,
  type PlayerIndex,
  type ScoreEvent,
  type ScoreKind,
} from '@/games/cribbage/engine';

import {
  appendDigit,
  buildMessage,
  changeKind,
  describeDropped,
  describeScore,
  errorsFor,
  initialFormFor,
  isDealerOnly,
  isDirty,
  kindHint,
  kindLabel,
  parsePlayerParam,
  parsePoints,
  previewTotals,
  quickPointsFor,
  removeLastDigit,
  toInput,
  type ScoreForm,
} from './scoreEntry';

const ctx2: GameContext = { playerCount: 2, firstDealer: 0, config: STANDARD_CONFIG };
const ctx3: GameContext = { playerCount: 3, firstDealer: 1, config: STANDARD_CONFIG };
const shortCtx: GameContext = { playerCount: 2, firstDealer: 0, config: SHORT_CONFIG };

type Row = [player: PlayerIndex, kind: ScoreKind, points: number, deal?: number];

function events(rows: Row[], ctx: GameContext = ctx2): ScoreEvent[] {
  return rebuildEvents(
    rows.map(([player, kind, points, deal = 1], i) => ({
      id: `e${i + 1}`,
      input: { player, kind, points, deal },
    })),
    ctx,
  );
}

const form = (player: PlayerIndex, kind: ScoreKind, pointsText: string): ScoreForm => ({
  player,
  kind,
  pointsText,
});

describe('parsePoints', () => {
  it.each([
    ['', null],
    ['0', 0],
    ['7', 7],
    ['29', 29],
    ['30', 30],
    ['007', null],
    ['-1', null],
    ['1.5', null],
    ['ab', null],
  ])('%j -> %j', (text, expected) => {
    expect(parsePoints(text)).toBe(expected);
  });
});

describe('appendDigit / removeLastDigit', () => {
  it('appends digits up to the maximum', () => {
    expect(appendDigit('', '2')).toBe('2');
    expect(appendDigit('2', '9')).toBe('29');
    expect(appendDigit('1', '0')).toBe('10');
  });

  it('replaces a leading zero', () => {
    expect(appendDigit('0', '5')).toBe('5');
    expect(appendDigit('', '0')).toBe('0');
  });

  it('starts a new number when a digit would exceed 29, but ignores a stray zero', () => {
    expect(appendDigit('29', '5')).toBe('5');
    expect(appendDigit('12', '3')).toBe('3');
    expect(appendDigit('3', '0')).toBe('3');
    expect(appendDigit('29', '0')).toBe('29');
  });

  it('removes the last digit', () => {
    expect(removeLastDigit('12')).toBe('1');
    expect(removeLastDigit('1')).toBe('');
    expect(removeLastDigit('')).toBe('');
  });
});

describe('quick points and kind helpers', () => {
  it('offers six shortcut values for counting kinds and pegging, and none for heels', () => {
    expect(quickPointsFor('pegging')).toHaveLength(6);
    expect(quickPointsFor('other')).toEqual(quickPointsFor('pegging'));
    expect(quickPointsFor('hand')).toEqual(quickPointsFor('crib'));
    expect(quickPointsFor('heels')).toEqual([]);
    for (const kind of ['pegging', 'hand', 'crib', 'heels', 'other'] as const) {
      for (const points of quickPointsFor(kind)) {
        expect(validateScore({ player: 0, kind: 'other', points, deal: 1 }, ctx2)).toEqual([]);
      }
    }
  });

  it('knows which kinds are dealer-only and labels them', () => {
    expect(isDealerOnly('crib')).toBe(true);
    expect(isDealerOnly('heels')).toBe(true);
    expect(isDealerOnly('hand')).toBe(false);
    expect(kindLabel('heels')).toBe('His heels');
  });

  it('names the dealer in dealer-only hints', () => {
    expect(kindHint('crib', 'Ann')).toContain('dealer: Ann');
    expect(kindHint('heels', 'Ann')).toContain('dealer: Ann');
    expect(kindHint('hand', 'Ann')).toBe('Counting a hand');
  });
});

describe('toInput / errorsFor', () => {
  it('builds the engine input', () => {
    expect(toInput(form(1, 'hand', '12'), 3)).toEqual({
      player: 1,
      kind: 'hand',
      points: 12,
      deal: 3,
    });
    expect(Number.isNaN(toInput(form(1, 'hand', ''), 1).points)).toBe(true);
  });

  it('accepts valid scores', () => {
    expect(errorsFor(form(1, 'pegging', '2'), 1, ctx2)).toEqual([]);
    expect(errorsFor(form(0, 'crib', '8'), 1, ctx2)).toEqual([]);
    expect(errorsFor(form(0, 'heels', '2'), 1, ctx2)).toEqual([]);
  });

  it('says nothing about points until some are typed', () => {
    expect(errorsFor(form(0, 'pegging', ''), 1, ctx2)).toEqual([]);
    expect(errorsFor(form(0, 'heels', ''), 1, ctx2)).toEqual([]);
    expect(errorsFor(form(1, 'crib', ''), 1, ctx2)).toEqual([ERROR_CRIB_DEALER]);
  });

  it('reports out-of-range points', () => {
    expect(errorsFor(form(0, 'hand', '0'), 1, ctx2)).toEqual([ERROR_POINTS_RANGE]);
    expect(errorsFor(form(0, 'hand', '30'), 1, ctx2)).toEqual([ERROR_POINTS_RANGE]);
  });

  it('enforces dealer-only kinds for the dealer of that deal', () => {
    expect(errorsFor(form(1, 'crib', '4'), 1, ctx2)).toEqual([ERROR_CRIB_DEALER]);
    expect(errorsFor(form(1, 'heels', '2'), 1, ctx2)).toEqual([ERROR_HEELS_DEALER]);
    // Deal 2: player 1 deals in a 2-player game starting with player 0.
    expect(errorsFor(form(1, 'crib', '4'), 2, ctx2)).toEqual([]);
    expect(errorsFor(form(0, 'crib', '4'), 2, ctx2)).toEqual([ERROR_CRIB_DEALER]);
    // First dealer 1 in a 3-player game: deal 3 is dealt by player 0.
    expect(errorsFor(form(0, 'heels', '2'), 3, ctx3)).toEqual([]);
  });

  it('requires heels to be exactly 2 points', () => {
    expect(errorsFor(form(0, 'heels', '3'), 1, ctx2)).toEqual([ERROR_HEELS_POINTS]);
  });

  it('rejects a player who is not in the game', () => {
    expect(errorsFor(form(2, 'pegging', '2'), 1, ctx2)).toEqual([ERROR_PLAYER_RANGE]);
  });

  it('matches the engine for every kind, player and sample points', () => {
    for (const ctx of [ctx2, ctx3, shortCtx]) {
      for (const kind of ['pegging', 'hand', 'crib', 'heels', 'other'] as const) {
        for (const player of [0, 1, 2] as const) {
          for (const pointsText of ['1', '2', '29', '0', '30']) {
            for (const deal of [1, 2, 3]) {
              const f = form(player, kind, pointsText);
              expect(errorsFor(f, deal, ctx)).toEqual(validateScore(toInput(f, deal), ctx));
            }
          }
        }
      }
    }
  });
});

describe('initialFormFor', () => {
  it('starts an add with the player left of the dealer', () => {
    expect(initialFormFor(undefined, 0, 2)).toEqual(form(1, 'pegging', ''));
    expect(initialFormFor(undefined, 1, 2)).toEqual(form(0, 'pegging', ''));
    expect(initialFormFor(undefined, 2, 3)).toEqual(form(0, 'pegging', ''));
    expect(initialFormFor(undefined, 0, 3)).toEqual(form(1, 'pegging', ''));
  });

  it('prefers the player from the route', () => {
    expect(initialFormFor(undefined, 0, 3, 2)).toEqual(form(2, 'pegging', ''));
    expect(initialFormFor(undefined, 0, 3, 0)).toEqual(form(0, 'pegging', ''));
  });

  it('loads an event for editing, ignoring the dealer', () => {
    const [event] = events([[1, 'hand', 12]]);
    expect(initialFormFor(event, 0, 2, 0)).toEqual(form(1, 'hand', '12'));
  });
});

describe('changeKind', () => {
  it('sets heels to 2 points for the dealer', () => {
    expect(changeKind(form(0, 'pegging', '9'), 'heels', 1)).toEqual(form(1, 'heels', '2'));
  });

  it('moves the crib to the dealer and keeps the points', () => {
    expect(changeKind(form(0, 'pegging', '9'), 'crib', 1)).toEqual(form(1, 'crib', '9'));
  });

  it('leaves player and points alone for other kinds', () => {
    expect(changeKind(form(0, 'pegging', '9'), 'hand', 1)).toEqual(form(0, 'hand', '9'));
    expect(changeKind(form(1, 'heels', '2'), 'other', 1)).toEqual(form(1, 'other', '2'));
  });
});

describe('isDirty', () => {
  const base = form(1, 'pegging', '');
  it('detects any difference', () => {
    expect(isDirty(base, { ...base })).toBe(false);
    expect(isDirty({ ...base, player: 0 }, base)).toBe(true);
    expect(isDirty({ ...base, kind: 'hand' }, base)).toBe(true);
    expect(isDirty({ ...base, pointsText: '2' }, base)).toBe(true);
  });
});

describe('parsePlayerParam', () => {
  it('reads a player index within the player count', () => {
    expect(parsePlayerParam('0', 2)).toBe(0);
    expect(parsePlayerParam('1', 2)).toBe(1);
    expect(parsePlayerParam(['2', '0'], 3)).toBe(2);
  });

  it('ignores anything else', () => {
    expect(parsePlayerParam(undefined, 2)).toBeNull();
    expect(parsePlayerParam('2', 2)).toBeNull();
    expect(parsePlayerParam('-1', 3)).toBeNull();
    expect(parsePlayerParam('x', 3)).toBeNull();
    expect(parsePlayerParam('10', 3)).toBeNull();
    expect(parsePlayerParam([], 3)).toBeNull();
  });
});

describe('previewTotals', () => {
  const played = events([
    [0, 'pegging', 4],
    [1, 'hand', 6],
    [0, 'hand', 8],
  ]);

  it('shows the total before and after adding a score', () => {
    expect(previewTotals(played, form(0, 'pegging', '6'), 1, ctx2)).toEqual({
      before: 12,
      after: 18,
      wins: false,
      dropped: 0,
    });
    expect(previewTotals(played, form(1, 'pegging', '2'), 1, ctx2)).toMatchObject({
      before: 6,
      after: 8,
    });
  });

  it('is null until the form is complete and valid', () => {
    expect(previewTotals(played, form(0, 'pegging', ''), 1, ctx2)).toBeNull();
    expect(previewTotals(played, form(0, 'pegging', '0'), 1, ctx2)).toBeNull();
    expect(previewTotals(played, form(1, 'crib', '4'), 1, ctx2)).toBeNull();
  });

  it('flags the score that reaches the target and caps the total', () => {
    const near = events([
      [0, 'hand', 29],
      [0, 'hand', 29],
      [0, 'hand', 29],
      [0, 'hand', 29],
      [0, 'hand', 2],
    ]);
    expect(previewTotals(near, form(0, 'pegging', '2'), 1, ctx2)).toMatchObject({
      before: 118,
      after: 120,
      wins: false,
    });
    expect(previewTotals(near, form(0, 'pegging', '3'), 1, ctx2)).toMatchObject({
      before: 118,
      after: 121,
      wins: true,
    });
    expect(previewTotals(near, form(0, 'hand', '20'), 1, ctx2)).toMatchObject({
      before: 118,
      after: 121,
      wins: true,
    });
  });

  it('uses the target of a short game', () => {
    const short = events([[0, 'hand', 29]], shortCtx);
    expect(previewTotals(short, form(0, 'hand', '29'), 1, shortCtx)).toMatchObject({
      after: 58,
      wins: false,
    });
    const closer = events(
      [
        [0, 'hand', 29],
        [0, 'hand', 29],
      ],
      shortCtx,
    );
    expect(previewTotals(closer, form(0, 'pegging', '3'), 1, shortCtx)).toMatchObject({
      after: 61,
      wins: true,
    });
  });

  it('works for three players', () => {
    const three = events(
      [
        [0, 'pegging', 2],
        [2, 'pegging', 5],
      ],
      ctx3,
    );
    expect(previewTotals(three, form(2, 'pegging', '4'), 1, ctx3)).toMatchObject({
      before: 5,
      after: 9,
    });
  });

  describe('editing', () => {
    it('replaces the score being edited rather than adding to it', () => {
      const editing = played[2];
      expect(previewTotals(played, form(0, 'hand', '12'), 1, ctx2, editing)).toEqual({
        before: 12,
        after: 16,
        wins: false,
        dropped: 0,
      });
    });

    it('moves points to another player', () => {
      const editing = played[0];
      expect(previewTotals(played, form(1, 'pegging', '4'), 1, ctx2, editing)).toMatchObject({
        before: 6,
        after: 10,
      });
    });

    const long = events([
      [0, 'hand', 29], // e1
      [1, 'hand', 10], // e2
      [0, 'hand', 29], // e3
      [1, 'hand', 10], // e4
      [0, 'hand', 29], // e5
      [1, 'hand', 10], // e6
      [0, 'hand', 29], // e7 -> 116
      [1, 'hand', 10], // e8
      [0, 'hand', 5], // e9 -> 121, wins
    ]);

    it('counts later events dropped when an edit ends the game sooner', () => {
      expect(long).toHaveLength(9);
      // Giving e2 to player 0 brings them to 145 at e7, so e8 and e9 are removed.
      const preview = previewTotals(long, form(0, 'hand', '29'), 1, ctx2, long[1]);
      expect(preview).toEqual({ before: 121, after: 121, wins: true, dropped: 2 });
    });

    it('does not warn when the edit leaves the game ending where it was', () => {
      expect(previewTotals(long, form(0, 'hand', '8'), 1, ctx2, long[8])).toMatchObject({
        before: 121,
        after: 121,
        wins: true,
        dropped: 0,
      });
    });

    it('shows that an edit reopens a finished game', () => {
      expect(previewTotals(long, form(0, 'hand', '1'), 1, ctx2, long[8])).toEqual({
        before: 121,
        after: 117,
        wins: false,
        dropped: 0,
      });
    });

    it('treats an unknown edited event as a new score', () => {
      const ghost = { ...played[0], id: 'missing' };
      expect(previewTotals(played, form(0, 'pegging', '6'), 1, ctx2, ghost)).toMatchObject({
        before: 12,
        after: 18,
        dropped: 0,
      });
    });
  });
});

describe('buildMessage', () => {
  const preview = { before: 87, after: 93, wins: false, dropped: 0 };

  it('shows the preview', () => {
    expect(buildMessage({ errors: [], saveErrors: [], preview, playerName: 'Alice' })).toEqual({
      tone: 'ok',
      lines: ['Alice: 87 → 93'],
      notes: [],
    });
  });

  it('announces a win and later events that will be removed', () => {
    const message = buildMessage({
      errors: [],
      saveErrors: [],
      preview: { before: 118, after: 121, wins: true, dropped: 2 },
      playerName: 'Alice',
    });
    expect(message.notes).toEqual(['Wins the game!', describeDropped(2)]);
    expect(describeDropped(1)).toContain('1 later score will');
    expect(describeDropped(2)).toContain('2 later scores will');
  });

  it('prompts for points before there is a preview, or shows a notice', () => {
    expect(buildMessage({ errors: [], saveErrors: [], preview: null, playerName: 'Bob' })).toEqual({
      tone: 'neutral',
      lines: ['Enter points for Bob'],
      notes: [],
    });
    expect(
      buildMessage({
        errors: [],
        saveErrors: [],
        preview: null,
        playerName: 'Bob',
        notice: 'Added Alice +6 (Hand)',
      }).lines,
    ).toEqual(['Added Alice +6 (Hand)']);
  });

  it('shows engine errors, and store errors before them', () => {
    const errors = [ERROR_CRIB_DEALER];
    expect(buildMessage({ errors, saveErrors: [], preview: null, playerName: 'A' })).toEqual({
      tone: 'error',
      lines: errors,
      notes: [],
    });
    expect(
      buildMessage({ errors, saveErrors: ['Score not found.'], preview, playerName: 'A' }),
    ).toEqual({ tone: 'error', lines: ['Score not found.'], notes: [] });
  });
});

describe('describeScore', () => {
  it('summarises a score', () => {
    expect(describeScore({ player: 1, kind: 'hand', points: 6, deal: 1 }, ['Ann', 'Bob'])).toBe(
      'Bob +6 (Hand)',
    );
  });
});
