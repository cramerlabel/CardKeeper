# Step 8 — Scoreboard screen and going live

Read [hearts-plan.md](./hearts-plan.md) first, then the Handoffs of steps [3](./hearts-step-03.md), [4](./hearts-step-04.md), [6](./hearts-step-06.md), [7](./hearts-step-07.md).

## Context from previous steps
- Components/builders from step 6 (player panel, pass badge, history, `rankPlayers`), hand-entry route from step 7 (`/hearts/hand`, `?handId=`), store + selectors (step 3), saved-games home wiring and reuse verdict (step 4), setup (step 5).
- Reference screen: `src/app/gin/scoreboard.tsx` plus `src/features/scoreboard/{GameMenu,useTextScale}`: focus-based redirect to game-over, hydration guard, responsive portrait/landscape layouts, menu, confirmations. Mirror it (and `src/app/spades/scoreboard.tsx` / cribbage's board if present).
- `/hearts/game-over` is built in step 9. Use `router.replace('/hearts/game-over' as never)`; implement the focus redirect now exactly like gin (it only fires when a game finishes). Until step 9 a finished game may sit on the scoreboard.
- Registry entry `hearts` is `available: false`; this step flips it.

## Goal
`src/app/hearts/scoreboard.tsx`: the main playing screen.

## Tasks
1. Header: back chevron, "Hearts", subtitle "Hand N · game to 100" (target from config; lowest score wins), menu button.
2. Four player panels (step 6) in a 2×2 grid (portrait phone) or a single row / left column (landscape, tablet) fed by `selectTotals`, `selectDealer`, `selectResult().ranking`; lowest total highlighted as leader.
3. Pass-direction banner for the upcoming hand ("Hand 3 · Pass across", "No pass this hand") and the dealer ("Dealer: Bob").
4. Primary action **"Enter hand"** (opens `/hearts/hand`).
5. History (step 6) below/beside; tapping a row opens `/hearts/hand?handId=<id>`.
6. Menu (`GameMenu`): Undo last hand, End game now, Abandon game, How to play (`openRules('hearts')`), Back to menu — same confirmations as gin.
7. Focus redirect to `/hearts/game-over` when `status === 'finished'`; `Redirect` home when no game; hydration guard (`useHeartsHydrated`).
8. **Go live:** set `available: true` for `hearts` in `src/games/registry.ts`; confirm the home grid opens `/hearts/setup` and the home "Continue game" card works for hearts (shows all four names and totals; discard works); update `README.md` intro (list Hearts as playable alongside whatever the other games' steps already changed) and registry/step docs as needed.
9. Text scale: respect `useTextScale`/large fonts and test font scale 1.3/1.5.

## Acceptance criteria
- Full loop: setup → enter hand → totals/rank/dealer/pass direction update → edit an old hand (later totals recompute, winner can change) → undo → end game / abandon; a saved game resumes after app restart.
- Game ends automatically when someone is ≥ target and the lowest is unique; with a tie for lowest play continues.
- No scrolling needed for all four panels + primary action on a 360×740 phone in portrait; history scrolls independently.
- Home grid: Hearts is playable and Continue works alongside the other games.

## Verify
`npm run lint && npm run typecheck && npm test`; emulator walkthrough, portrait + landscape, phone + tablet.

## Handoff (fill in when done)
- Files created/changed:
- Layout breakpoints/decisions:
- What the game-over screen needs (selectors/routes):
- Known issues:
- Updates made to later step plans:

**Before ending:** update `hearts-step-09.md` and `hearts-step-10.md`; commit `Hearts step 8: scoreboard screen`.
