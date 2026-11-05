# Step 9 — Game-over screen

Read [spades-plan.md](./spades-plan.md) first, then the Handoffs of steps [2](./spades-step-02.md), [3](./spades-step-03.md), [8](./spades-step-08.md).

## Context from previous steps
- Engine `computeResult(hands, ctx)` => `{ winner, reason ('target' | 'floor' | null), totals, bags, margin, handsPlayed, nil, bagPenalties }` (see step 2 Handoff for the behaviour when nobody has won); store `selectResult`, `finishGame`, `abandonGame`, `startGame`, `history`.
- The scoreboard redirects to `/spades/game-over` when the game finishes (step 8).
- Reference: `src/app/gin/game-over.tsx`, `src/features/gameOver/{WinnerBanner,ScoreBreakdown,summary}.ts*` + `summary.test.ts` (and cribbage's game-over if present — reuse whatever generalisation it did).
- Register in `src/app/_layout.tsx`: `<Stack.Screen name="spades/game-over" options={{ animation: 'fade' }} />`.

## Goal
Celebrate the result, show the final breakdown, and offer next actions.

## Tasks
1. Pure `src/features/spadesGameOver/summary.ts` (+ test): `buildSpadesSummary(result, players, config)` => headline ("Alice & Carol win!" / "Game ended early" / tie), subline (reason: "reached 500" or "Bob & Dave fell to −200", margin, hands played), per-team rows (label, final score, bags carried, bag penalties taken), highlights (nil stats: "Nil made 3/4 — Alice", blind nil made/failed), emphasis flags. Cases: target win, win by opponent hitting floor, both over target (higher wins), exact tie continuing (not game over), early finish (no winner; leader by points), 300/200 targets, no nil attempts (omit highlights).
2. Screen `src/app/spades/game-over.tsx`: `WinnerBanner`-style header (reuse the generic component if cribbage/gin left one, else generalise without changing their output), results table with both teams, nil/bag highlights, buttons "New game" (→ `/spades/setup`, names prefilled), "Back to menu", and "Review hands" (**decide the simplest option** — read-only `SpadesHistory` from step 6 on this screen — and document it).
3. Guards: `Redirect` to home when no finished game; fall back to `history[0]` when `currentGame` was cleared.
4. Confirm the finished game is in `history` and the home "Continue" card no longer shows it (`selectHasSavedGame` false).
5. Haptics only, consistent with gin game-over.

## Acceptance criteria
- Reaching the target (or the opposing team hitting the floor) from hand entry lands here with the correct winner, reason, margin and nil/bag highlights; ending early shows the no-winner variant; works in portrait/landscape on phone and tablet.
- Summary tests cover all cases listed above.

## Verify
`npm run lint && npm run typecheck && npm test`; emulator walkthrough (use target 200 in setup to finish quickly).

## Handoff (fill in when done)
- Files created/changed:
- "Review hands" decision:
- Known issues:
- Updates made to later step plans:

**Before ending:** update `spades-step-10.md`; commit `Spades step 9: game over`.
