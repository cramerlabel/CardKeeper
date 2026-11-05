# Step 8 — Board screen (main game screen) and going live

Read [../plan.md](../plan.md) first, then the Handoffs of steps [2](../step-02-store/plan.md), [4](../step-04-rules-and-shared-ui/plan.md), [6](../step-06-board-component/plan.md), [7](../step-07-score-entry/plan.md).

## Context from previous steps
- `CribbageBoard` component (step 6; real API): `import { CribbageBoard } from '@/features/cribbageBoard/CribbageBoard'` with props `{ pegs: PegPosition[] (selectPegs); playerNames: string[]; config: CribbageConfig; dealer?: PlayerIndex (selectDealer); style?; animate?: boolean }`. It is `flex: 1` and fills the box you give it (it measures itself), so wrap it in a View with a definite size (e.g. `flex: 1` inside a sized parent). **Key it by the game id** (`key={currentGame.id}`) so a new game does not animate pegs back from the previous one. Board orientation follows the box: taller than wide => vertical track, otherwise horizontal. Minimum readable boxes: 3 players >= 360x370 dp, 2 players >= 300x180 dp (smaller still renders, see the step 6 Handoff; much smaller renders nothing). Player-panel colour swatches should use `laneColor(playerIndex)` from `@/features/cribbageBoard/laneColors` so they match the pegs. Pegs animate on score changes (leapfrog), honour the OS reduce-motion setting, and the container is already an accessible element with a "Cribbage board. Alice 87, Bob 79. Alice is dealing." label, so do not wrap it in another accessible element. Remember that **Next deal changes `dealer` only** (pegs do not move). Also: score entry route and params (step 7), store (step 2), saved-games home wiring and `ContinueGameCard` (step 4; real API: `buildSavedGames` in `src/features/home/savedGames.ts` already includes cribbage with route `/cribbage/board` and `Deal N` label, and `src/app/index.tsx` already wires cribbage continue/discard — only `available: true` and the registry test remain), setup (step 5: `/cribbage/setup` calls `startGame` then `router.replace('/cribbage/board' as never)`, so the board must render a brand-new game — `deal = 1`, no events, all pegs at the start — and the screen is currently an "Unmatched Route" until this step).
- Reference screen: `src/app/gin/scoreboard.tsx` plus `src/features/scoreboard/{ScorePanel,HandHistory,GameMenu,history,useTextScale}`: focus-based redirect to game-over, hydration guard, responsive portrait/landscape layouts, menu, confirmations.
- `/cribbage/game-over` is built in step 9. Until then the redirect target is missing: use `router.replace('/cribbage/game-over' as never)`; to avoid a dead end, this step temporarily may leave a finished game on the board — **step 9 adds the redirect check**. Implement the focus redirect now exactly like gin (it only fires when a game finishes).
- Registry entry `cribbage` is `available: false`; this step flips it.
- Real store API (step 2): `nextDeal()` returns `ActionResult` (fails when finished) and only increments `currentGame.deal` (events array identity unchanged); dealer = `selectDealer`. Scores belonging to the current deal: `events.filter(e => e.deal === game.deal)`. `undoLastScore`, `deleteScore`, `finishGame` (requires ≥1 event) return `ActionResult`; `abandonGame`/`clear` return void. `deal` never drops below the highest event deal after delete/undo (it is not decremented, so Undo does not step the dealer back). Selectors: `selectTotals`, `selectPegs`, `selectResult` (null without a game), `selectDealer`, `selectContext`, `selectIsGameOver` (target reached, not early finish), `selectHasSavedGame`. Hook `useCribbageHydrated()` gates reading `currentGame`.

## Goal
`src/app/cribbage/board.tsx`: the playing screen.

## Tasks
1. Header: back chevron, "Cribbage", subtitle "Deal N · first to 121", menu button.
2. Board area: `CribbageBoard` fed by `selectPegs`, `selectDealer`, names, config. Portrait: board on top (takes ~50% height, vertical board), panels below. Landscape: board left, panels + history right. Tablets scale up.
3. Player panels (adapt `ScorePanel` or make `CribbagePlayerPanel`): name, total, "Dealer · crib" badge, "+ Score" button opening `/cribbage/score?player=<i>`; leader highlight; 2 or 3 panels.
4. History: events grouped under "Deal N" headers (newest first); row = kind label, player, `+points`, running total; tap opens `/cribbage/score?eventId=<id>`. Pure builder `src/features/cribbageHistory/history.ts` + test (running totals per player, grouping, labels).
5. Primary actions: "Add score" (opens entry with no preselection) and "Next deal" (confirmation only if no scores recorded this deal; advances dealer, updates crib indicator).
6. Menu (`GameMenu`): Undo last score, End game now, Abandon game, How to play (`openRules('cribbage')`), Back to menu — with the same confirmations as gin.
7. Focus redirect to `/cribbage/game-over` when `status === 'finished'`; `Redirect` home when no game; hydration guard.
8. Go live: set `available: true` for `cribbage` in `src/games/registry.ts`; confirm home grid opens `/cribbage/setup`; confirm the home "Continue game" card for cribbage works (steps 4 wiring) incl. 3 players; update `README.md` intro ("Gin Rummy and Cribbage are playable…") and the registry/step docs as needed.
9. Text scale: respect `useTextScale`/large fonts (`maxFontSizeMultiplier`) and test with font scale 1.3/1.5 as in earlier QA.

## Acceptance criteria
- Full play loop: setup -> add scores -> pegs move/animate, dealer rotates on Next deal -> edit/delete -> undo -> end game / abandon; saved game resumes after app restart with identical pegs.
- No scrolling needed for board + panels + Add score on a 360x740 phone in portrait; history scrolls independently.
- Pure history builder tests green.

## Verify
`npm run lint && npm run typecheck && npm test`; emulator walkthrough for 2 and 3 players, portrait + landscape, phone + tablet.

## Handoff (fill in when done)
- Files created/changed:
- Layout breakpoints/decisions:
- Anything the game-over screen needs (selectors/routes):
- Known issues:
- Updates made to later step plans:

**Before ending:** update `step-09-game-over/plan.md` and `step-10-qa-and-release/plan.md`; commit `Cribbage step 8: board screen`.
