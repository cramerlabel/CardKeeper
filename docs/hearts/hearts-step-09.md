# Step 9 — Game-over screen

Read [hearts-plan.md](./hearts-plan.md) first, then the Handoffs of steps [2](./hearts-step-02.md), [3](./hearts-step-03.md), [8](./hearts-step-08.md).

## Context from previous steps
- Engine `computeResult(hands, ctx)` ⇒ `{ winner, ranking, totals, margin, handsPlayed, stats }` (see step 2 Handoff for behaviour when nobody has won and for tied leaders); store `selectResult`, `finishGame`, `abandonGame`, `startGame`, `history`.
- The scoreboard redirects to `/hearts/game-over` when the game finishes (step 8).
- Reference: `src/app/gin/game-over.tsx`, `src/features/gameOver/{WinnerBanner,ScoreBreakdown,summary}.ts*` + `summary.test.ts` (and the cribbage/spades game-over screens if present — reuse whatever generalisation they did).
- Register in `src/app/_layout.tsx`: `<Stack.Screen name="hearts/game-over" options={{ animation: 'fade' }} />`.

## Goal
Celebrate the winner, show the final ranking and highlights, and offer next actions.

## Tasks
1. Pure `src/features/heartsGameOver/summary.ts` (+ test): `buildHeartsSummary(result, players, config)` ⇒ headline ("Alice wins!" / "Game ended early" / "Alice and Bob are tied"), subline (reason: "Carol reached 100 — lowest score wins", margin, hands played, early-finish wording), ranked rows (rank, name, final total, emphasis for the winner, per-player stats such as hands with 0 points), highlights (moons shot by whom, queens taken, best/worst single hand; omit sections with nothing to say), emphasis flags. Cases: normal win, winner is not the player who crossed the target, win with a negative total (`shooterSubtracts`), moon that ended the game, early finish with a unique leader, early finish with tied leaders (no winner), 50/150 targets, no moons (omit highlight).
2. Screen `src/app/hearts/game-over.tsx`: `WinnerBanner`-style header (reuse the generic component if cribbage/spades/gin left one, else generalise without changing their output), a ranked list of all four players (1st–4th, ties share rank), highlights, buttons "New game" (→ `/hearts/setup`, names prefilled), "Back to menu", and "Review hands" (**decide the simplest option** — read-only `HeartsHistory` from step 6 on this screen — and document it).
3. Guards: `Redirect` to home when no finished game; fall back to `history[0]` when `currentGame` was cleared.
4. Confirm the finished game is in `history` and the home "Continue" card no longer shows it (`selectHasSavedGame` false).
5. Haptics only, consistent with gin game-over.

## Acceptance criteria
- Reaching the target from hand entry lands here with the correct winner, margin and highlights; ending early shows the no-winner or tied-leader variant; works in portrait/landscape on phone and tablet.
- Summary tests cover all cases listed above.

## Verify
`npm run lint && npm run typecheck && npm test`; emulator walkthrough (use target 50 in setup to finish quickly).

## Handoff (fill in when done)
- Files created/changed:
- "Review hands" decision:
- Known issues:
- Updates made to later step plans:

**Before ending:** update `hearts-step-10.md`; commit `Hearts step 9: game over`.
