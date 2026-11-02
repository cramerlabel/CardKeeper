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
- DONE. Route `/gin/game-over` (`src/app/gin/game-over.tsx`); logic in `src/features/gameOver/` (`summary.ts` = pure, tested `buildSummary`/`formatValue` over the engine's `computeFinalScore`; `WinnerBanner`, `ScoreBreakdown`). No engine or store changes.
- Winner = **higher final score** (`finalLeader`), per the rules; if the other player reached 100 first the subline says so ("Alexandria reached 100 first, but Bob has the higher final score."). Tie shows "It's a tie!" with a handshake icon. Early "End game now" shows "Game ended early. No game bonus awarded." Shutout shows "Game bonus: Shutout!" (+200). Rows: hands won, points scored, box bonus, game bonus, final score. Success haptic and a spring pop on mount.
- **Finished-game persistence:** the store already copies a finished game into `history` (max 20) when it finishes. While this screen is open the game is still `currentGame` (status `finished`) so the result survives an app kill/restart (reopening the app shows Home without Continue, because Continue needs `inProgress`; the finished result isn't re-openable yet). Every exit clears or replaces `currentGame`: **Return to menu** and hardware **Back** → `abandonGame()` + `router.replace('/')`; **New game** → `abandonGame()` + replace to `/gin/setup`; **Rematch** → `startGame(sameNames)` + replace to `/gin/scoreboard`. `abandonGame` only clears `currentGame`, so the result stays in `history`. Swipe-back is disabled on this screen.
- Extra: **Undo last hand** (text link) reopens the game via `undoLastHand()` and goes back to the scoreboard (confirm dialog), for a mis-entered final hand.
- Layouts: portrait = banner, table, buttons stacked (scrolls on small screens); landscape/expanded = banner + buttons left, table right; dense landscape (phone on its side) = banner row on top, buttons and table side by side, no scrolling.
- Verified on the Pixel 7 emulator: normal win, shutout, Rematch, New game (setup shown, `currentGame` null), Return to menu / hardware Back (Home, no Continue card, game in `history`), Undo, landscape; tablet-sized display (portrait + landscape) with the "reached 100 first but lost" case. Not run: real `Pixel_Tablet_API_35` AVD, tie and early-end cases on device (unit-tested only).
- **Emulator gotcha:** I tested a tablet size with `adb shell wm size 1600x2560` and `wm density 240`, and the emulator died before I could reset them. Run `adb shell wm size reset; adb shell wm density reset` after the next boot.
- Update for `step-9.md` done (below).
