# Step 8 — Scoreboard screen and going live

Read [spades-plan.md](./spades-plan.md) first, then the Handoffs of steps [3](./spades-step-03.md), [4](./spades-step-04.md), [6](./spades-step-06.md), [7](./spades-step-07.md).

## Context from previous steps
- Components/builders from step 6 (team panel, history, `describeContract`), hand-entry route from step 7 (`/spades/hand`, `?handId=`), store + selectors (step 3), saved-games home wiring and reuse verdict (step 4), setup (step 5).
- Reference screen: `src/app/gin/scoreboard.tsx` plus `src/features/scoreboard/{GameMenu,useTextScale}`: focus-based redirect to game-over, hydration guard, responsive portrait/landscape layouts, menu, confirmations. Mirror it (and cribbage's `board.tsx` if present).
- `/spades/game-over` is built in step 9. Use `router.replace('/spades/game-over' as never)`; implement the focus redirect now exactly like gin (it only fires when a game finishes). Until step 9 a finished game may sit on the scoreboard.
- Registry entry `spades` is `available: false`; this step flips it.

## Goal
`src/app/spades/scoreboard.tsx`: the main playing screen.

## Tasks
1. Header: back chevron, "Spades", subtitle "Hand N · first to 500" (from config), menu button.
2. Two team panels (step 6) fed by `selectTotals`, `selectBags`, `selectDealer`, `currentGame.draftBids`; leader highlight. Portrait: panels stacked/side by side as space allows, history below. Landscape/tablet: panels left, history right.
3. Primary action button that depends on state: no saved bids → **"Enter bids"** (opens `/spades/hand`, which lets the user save just the bids); bids saved → **"Enter results"** (same route); always a secondary affordance to change the bids. Also show who deals the current hand ("Dealer: Bob · Alice leads").
4. History (step 6) below/beside; tapping a row opens `/spades/hand?handId=<id>`.
5. Menu (`GameMenu`): Undo last hand, End game now, Abandon game, How to play (`openRules('spades')`), Back to menu — same confirmations as gin. Add "Clear saved bids" when a draft exists.
6. Focus redirect to `/spades/game-over` when `status === 'finished'`; `Redirect` home when no game; hydration guard (`useSpadesHydrated`).
7. **Go live:** set `available: true` for `spades` in `src/games/registry.ts`; confirm the home grid opens `/spades/setup` and the home "Continue game" card works for spades (shows both team labels and totals; discard works); update `README.md` intro ("Gin Rummy, … and Spades are playable; …") and registry/step docs as needed (check what cribbage already changed).
8. Text scale: respect `useTextScale`/large fonts and test font scale 1.3/1.5.

## Acceptance criteria
- Full loop: setup → enter bids (draft shows on panels) → enter results → totals/bags/dealer update → edit an old hand (later totals and bag penalties recompute) → undo → end game / abandon; a saved game (including a draft) resumes after app restart.
- No scrolling needed for both team panels + primary action on a 360×740 phone in portrait; history scrolls independently.
- Home grid: Spades is playable and Continue works alongside the other games.

## Verify
`npm run lint && npm run typecheck && npm test`; emulator walkthrough, portrait + landscape, phone + tablet.

## Handoff (fill in when done)
- Files created/changed:
- Layout breakpoints/decisions:
- What the game-over screen needs (selectors/routes):
- Known issues:
- Updates made to later step plans:

**Before ending:** update `spades-step-09.md` and `spades-step-10.md`; commit `Spades step 8: scoreboard screen`.
