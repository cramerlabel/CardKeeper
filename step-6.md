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
- DONE. Screen: `src/app/gin/scoreboard.tsx`. Components in `src/features/scoreboard/`: `ScorePanel` (name, total, hands won, progress bar, gold "LEADING" highlight, `dense` mode), `HandHistory` (newest first, running-total column, empty state, rows tappable), `GameMenu` (modal action sheet), `history.ts` (pure, tested: `buildHistoryRows`, `leaderOf`, `progressFraction`, `OUTCOME_LABELS`), `useTextScale` (scales from the window's *short side*, so landscape phones don't get tablet-size text).
- `Card` now accepts `accessibilityLabel`/`accessible`.
- Layout: portrait compact/medium = panels in a row over the list, "Add hand" at the bottom. Landscape or expanded width = panels stacked on the left (with "Add hand"), history on the right. Landscape with height < 480dp ("dense") shrinks panels and moves "Add hand" into the header.
- Menu (⋮): Undo last hand (confirm), End game now (confirm → `finishGame`), Abandon game (confirm → `abandonGame`; screen `<Redirect>`s to `/` when `currentGame` is null), Back to menu. Undo/End are disabled with no hands.
- Game over: `useFocusEffect` does `router.replace('/gin/game-over')` whenever the screen is focused and `currentGame.status === 'finished'`. Stub at `src/app/gin/game-over.tsx` (Step 8 replaces the body).
- Hand entry stub: `src/app/gin/hand.tsx` (Step 7 replaces the body).
- Verified on the Pixel 7 emulator (phone portrait/landscape, empty state, undo, menu, game-over redirect, restore from saved game) and, via `adb shell wm size 1600x2560` + `wm density 240`, a tablet-sized display in portrait and landscape. The real `Pixel_Tablet_API_35` AVD was not booted. Test data was seeded by writing the store JSON into the app's `RKStorage` SQLite via `adb shell run-as`; the seeded game was deleted afterwards.
- Known rough edges: history rows are not virtualised beyond FlatList defaults (fine for a game); on very wide tablets the content is capped at 960dp so there is spare margin.
- `step-7.md` updated.
