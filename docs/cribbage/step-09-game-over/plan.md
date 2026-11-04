# Step 9 — Game-over screen and skunk result

Read [../plan.md](../plan.md) first, then the Handoffs of steps [2](../step-02-store/plan.md), [6](../step-06-board-component/plan.md), [8](../step-08-board-screen/plan.md).

## Context from previous steps
- Engine `computeResult(events, ctx)` => `{ winner, totals, skunk[], margin }`; store `selectResult`, `finishGame`, `abandonGame`, `startGame`.
- Board screen redirects to `/cribbage/game-over` when the game finishes (step 8).
- Reference: `src/app/gin/game-over.tsx`, `src/features/gameOver/{WinnerBanner,ScoreBreakdown,summary}.ts*` and `summary.test.ts`.
- Register in `src/app/_layout.tsx`: `<Stack.Screen name="cribbage/game-over" options={{ animation: 'fade' }} />`.
- Real store API (step 2): `finishGame()` requires ≥1 event and returns `ActionResult`; a game reaching the target auto-finishes and is pushed to `history` (newest first, max 20). `selectResult(state)` is `GameResult | null` (stable per events array); `selectIsGameOver` is false for early-finished games, so use `currentGame.status === 'finished'` plus `result.winner` (may be `null` when ended early with nobody at target — check this).

## Goal
Celebrate the result, show final positions on the board, and offer next actions.

## Tasks
1. Pure `src/features/cribbageGameOver/summary.ts` (+ test): `buildCribbageSummary(result, players, target, eventCount)` => headline ("Alice wins!", or "Game ended early" / tie when no one reached the target), subline (margin, "by N points", deals played), per-player rows (name, final points, skunk status, `Skunked!` / `Double skunk!` labels), emphasis flags. Handle early finish (no winner; leader by points, no skunk applied) and 3 players (two losers, each evaluated).
2. Screen `src/app/cribbage/game-over.tsx`: `WinnerBanner`-style header (reuse the gin component if it is generic enough, else generalise it without changing gin output), skunk callout, results table, a static (non-animated, `animate={false}`) `CribbageBoard` showing final peg positions, buttons "New game" (-> `/cribbage/setup`, remembers names), "Back to menu", and "Review scores" (back to board history in read-only mode **or** just show the history list; pick the simpler and document it).
3. Guards: `Redirect` to home if there is no finished game; use the latest finished game from `history[0]` when `currentGame` was cleared.
4. Make sure the finished game appears in history (store already does) and the home "Continue" card no longer shows it (`selectHasSavedGame` false).
5. Haptic/sound feedback consistent with gin game-over (haptics only).

## Acceptance criteria
- Reaching 121 (or 61) from score entry lands here with the correct winner, margin and skunk labels; ending early shows the no-winner variant.
- Works for 2 and 3 players, portrait/landscape.
- Summary builder tests cover: normal win, skunk, double skunk, 61-game skunk, 3-player mixed skunk, early end, tie.

## Verify
`npm run lint && npm run typecheck && npm test`; emulator walkthrough.

## Handoff (fill in when done)
- Files created/changed:
- "Review scores" decision:
- Known issues:
- Updates made to later step plans:

**Before ending:** update `step-10-qa-and-release/plan.md`; commit `Cribbage step 9: game over`.
