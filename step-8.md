# Step 8 — Game over screen

## Context
See `step-0.md` (final score rules) and `step-2.md` (`computeFinalScore`). Detection/store details from Step 7: the hand entry screen never navigates to game over itself. `addHand`/`updateHand` run `deriveStatus`, which sets `currentGame.status = 'finished'` as soon as a total reaches 100 (and moves the game into `history`); the screen then calls `router.back()` and the scoreboard redirects. The hand entry preview also shows "<name> reaches 100 and wins the game" before saving. Editing an earlier hand can reopen a finished game or truncate later hands (`updateHand` re-derives status from `'inProgress'`).
From Step 6: route `/gin/game-over` (stub at `src/app/gin/game-over.tsx` — replace its body, keep the path). The scoreboard reaches it with `router.replace` whenever it is focused and `currentGame.status === 'finished'` (set automatically when a total hits 100, or by the scoreboard menu's "End game now" → `finishGame`). Use `selectFinalScore`, `selectTotals`, `selectHandsWon` and `currentGame.players`. The stub's "Back to menu" does `router.replace('/')`. Note Home's Continue card only shows for `status === 'inProgress'`, but `/gin/scoreboard` for a finished game still redirects here.

## Goal
When a player reaches ≥ 100, declare the winner and show the official final score.

## Tasks
1. Winner banner (name, trophy/celebration visual, subtle animation, haptic).
2. Score breakdown table per player: running total, game bonus (100, or 200 for shutout — label "Shutout!"), box bonus (hands won × 25), **final score**. Show hands won count.
3. Buttons: **New Game** (same players: prefilled setup or immediate restart — offer "Rematch" with same names and "New game" to setup) and **Return to Menu**. Optionally "View hand history".
4. Store: mark game finished, persist, add to finished-game history; ensure leaving the screen clears the in-progress save so "Continue" does not offer a finished game (or offers read-only result — decide and document).
5. Back-button handling so users can't re-enter an ended game by accident.
6. Responsive layout for all sizes/orientations.

## Acceptance criteria
- Reaching 100 shows correct winner and final breakdown matching engine tests, including a shutout case.
- New Game / Menu both work; no stale game state remains.

## Handoff notes (fill in when done)
- Decisions on finished-game persistence and rematch: _TBD_
- Update `step-9.md` with: list of screens, known visual rough edges, any TODOs.
