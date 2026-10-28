# Step 6 — Scoreboard screen

## Context
See `step-0.md`. Route and store info from Step 5:
- Scoreboard route is `/gin/scoreboard` (stub at `src/app/gin/scoreboard.tsx` — replace its body, keep the path). Setup reaches it via `router.replace('/gin/scoreboard' as never)` (typed routes off), so Back from the scoreboard goes to Home, not setup.
- Store (`@/games/ginRummy/store`): `useGinStore`, `useGinHydrated()` (wait before reading `currentGame`), selectors `selectTotals`, `selectHandsWon`, `selectIsGameOver`, `selectFinalScore`, `selectHasSavedGame`; actions `addHand`, `updateHand`, `undoLastHand`, `finishGame`, `abandonGame`. `currentGame.players` holds the final (defaulted) names.

## Goal
The main in-game screen: each player's current score, hand-by-hand history, who won each hand.

## Tasks
1. Header with two large player score panels (name, total score, hands won, progress bar toward 100). Leader highlighted.
2. Hand history list: hand #, winner, outcome label (Knock / Undercut / Gin / Big Gin), points awarded, both deadwood values. Newest first or running-table style (decide, keep a running total column).
3. Primary "Add hand" button opens the hand entry screen (Step 7; stub route ok). Secondary menu: undo last hand (confirm), end/abandon game, back to menu.
4. Layouts: compact portrait = stacked panels over the list; landscape/expanded = panels left, history right (or side-by-side). Scales fonts for tablet.
5. When the store reports the game finished, navigate to game over (Step 8; stub ok).
6. Empty state for "no hands yet".

## Acceptance criteria
- Scores and history reflect the store; restoring a saved game shows the same data.
- Verified on phone and tablet emulators in both orientations.

## Handoff notes (fill in when done)
- Components (`ScorePanel`, `HandHistory`…), routes: _TBD_
- Update `step-7.md` with: how the entry screen is opened/closed, which player context to pass for edits.
