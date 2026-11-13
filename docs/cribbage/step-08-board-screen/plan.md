# Step 8 — Board screen (main game screen) and going live

Read [../plan.md](../plan.md) first, then the Handoffs of steps [2](../step-02-store/plan.md), [4](../step-04-rules-and-shared-ui/plan.md), [6](../step-06-board-component/plan.md), [7](../step-07-score-entry/plan.md).

## Context from previous steps
- `CribbageBoard` component (step 6; real API): `import { CribbageBoard } from '@/features/cribbageBoard/CribbageBoard'` with props `{ pegs: PegPosition[] (selectPegs); playerNames: string[]; config: CribbageConfig; dealer?: PlayerIndex (selectDealer); style?; animate?: boolean }`. It is `flex: 1` and fills the box you give it (it measures itself), so wrap it in a View with a definite size (e.g. `flex: 1` inside a sized parent). **Key it by the game id** (`key={currentGame.id}`) so a new game does not animate pegs back from the previous one. Board orientation follows the box: taller than wide => vertical track, otherwise horizontal. Minimum readable boxes: 3 players >= 360x370 dp, 2 players >= 300x180 dp (smaller still renders, see the step 6 Handoff; much smaller renders nothing). Player-panel colour swatches should use `laneColor(playerIndex)` from `@/features/cribbageBoard/laneColors` so they match the pegs. Pegs animate on score changes (leapfrog), honour the OS reduce-motion setting, and the container is already an accessible element with a "Cribbage board. Alice 87, Bob 79. Alice is dealing." label, so do not wrap it in another accessible element. Remember that **Next deal changes `dealer` only** (pegs do not move). Also: score entry route and params (step 7), store (step 2), saved-games home wiring and `ContinueGameCard` (step 4; real API: `buildSavedGames` in `src/features/home/savedGames.ts` already includes cribbage with route `/cribbage/board` and `Deal N` label, and `src/app/index.tsx` already wires cribbage continue/discard — only `available: true` and the registry test remain), setup (step 5: `/cribbage/setup` calls `startGame` then `router.replace('/cribbage/board' as never)`, so the board must render a brand-new game — `deal = 1`, no events, all pegs at the start — and the screen is currently an "Unmatched Route" until this step).
- Score entry modal (step 7; real API, `src/app/cribbage/score.tsx`, registered `slide_from_bottom` in `_layout.tsx`): open it with `router.push('/cribbage/score' as never)` (add), `'/cribbage/score?player=<0|1|2>'` (add, preselect that player; this is what each panel's "+ Score" button should use) or `` `/cribbage/score?eventId=${event.id}` `` (edit/delete a history row). It needs no callbacks: it writes to the store and goes back (`router.back()`, falling back to `router.replace('/cribbage/board')`), so the board just re-renders. It works on a snapshot of the game taken at mount. Guards: no game -> `/`; unknown `eventId` or adding to a finished game -> `/cribbage/board`. A winning score finishes the game via the store (`status: 'finished'`) and the modal closes — the board's focus effect must then redirect to `/cribbage/game-over`. An edit that ends the game sooner asks for confirmation and permanently drops the later events; a deleted/edited event id no longer exists afterwards, so do not keep ids across navigation. Pure helpers live in `src/features/scoreEntry/scoreEntry.ts` (`describeScore(event, names)` gives "Bob +6 (Hand)" and `kindLabel(kind)` the display label, both reusable for history rows).
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
  - New: `src/app/cribbage/board.tsx` (the screen); `src/features/cribbageHistory/{history.ts, history.test.ts, CribbageHistory.tsx}`; `src/features/cribbagePanel/CribbagePlayerPanel.tsx`; `src/features/cribbageScreen/cribbageBoardScreen.test.tsx` (25 screen tests against the real store, mocked `expo-router`/haptics/`@expo/vector-icons`).
  - Changed: `src/games/registry.ts` (`cribbage` -> `available: true`), `src/games/registry.test.ts` (Gin Rummy and Cribbage available, routes), `README.md` intro.
  - QA screenshots (Pixel 7 emulator, API 35, 1080x2220 @480 = 360x740 dp, and the same emulator resized to 1280x800 dp): `docs/qa/cribbage-boardscreen-{phone-portrait-3p,phone-landscape-3p,tablet-landscape-3p}.png`.
  - Route tests must NOT live under `src/app` (Expo Router turns every file there into a route and Metro then fails on the Jest globals); the screen test sits in `src/features/cribbageScreen/` and imports `@/app/cribbage/board`, like the score and setup screen tests.
- Public pieces:
  - `@/features/cribbageHistory/history`: `buildHistorySections({ events, players, firstDealer, deal, target }): HistorySection[]` (`{ deal, dealerName, isCurrent, rows }`, newest deal first, rows newest first; a section exists for every deal with scores plus always the current deal, even when empty; `HistoryRow` = `{ id, number, deal, player, playerName, kind, kindLabel, points, total (the player's running total, capped at the target), description ("Bob +6 (Hand)") }`), `flattenHistory(sections)` (flat list items for `FlatList`), `hasScoresInDeal(events, deal)`, `leaderOf(totals): PlayerIndex | null` (strict leader; `null` on a tie for the lead or 0-0).
  - `CribbageHistory({ sections, onSelectScore(id) })` (flex-1 card; a `FlatList` with "DEAL N / X deals|dealt" headers) and `CribbagePlayerPanel({ name, total, color, dealer, leading, dense?, onAddScore, style? })` (the whole panel is one 48dp+ button; `describePanel` builds its accessibility label).
- Layout breakpoints/decisions:
  - Same split as gin: `isLandscape` = side by side, `isDense` (landscape and height < 480 dp) moves "Next deal" and "Add score" into the header.
  - Portrait: board (`flex: 5`), panels row, history (`flex: 3`), then "Next deal" / "Add score" at the bottom (thumb reach, like gin's "Add hand"). 3 players on 360x740: everything including the buttons fits without scrolling; the board box is about 328x245 dp (horizontal track).
  - Landscape: board left (`flex: 1`), right column (`flex: 1`) with panels, the two buttons (not when dense) and the history. Tablet landscape gets a tall box, so the board is vertical there.
  - Panels: not wrapped in an accessible `Card` (a nested button would be unreachable by TalkBack); the panel itself is the button. Dense panels drop the "+ Score" pill and show a short "Dealer" badge beside the total so the history keeps some height on a phone on its side.
  - Text: `useTextScale` for sizes, `maxFontSizeMultiplier` 1.2/1.3 on panels, history and header; checked at font scale 1.5 in portrait (fits) and landscape (fits, but the history shows less than one row).
  - "Next deal" asks for confirmation only when the current deal has no scores; it announces "Deal N. Alice is dealing." for screen readers. Undo/End/Abandon use the same confirmations as gin; store failures (`ActionResult.ok === false`) are shown in an alert.
  - `CribbageBoard` is keyed by `game.id`; pegs/totals come from `selectPegs`/`selectTotals` and the dealer from `selectDealer`.
- Anything the game-over screen needs (selectors/routes):
  - The board's focus effect already does `router.replace('/cribbage/game-over' as never)` when `currentGame.status === 'finished'` (target reached via the score modal, or "End game now"). Game-over must handle `currentGame` with `status: 'finished'` (and `history[0]` once `currentGame` is cleared).
  - Reusable for a "Review scores" list: `buildHistorySections(...)` + `CribbageHistory` (pass a no-op `onSelectScore`, or navigate to the board); `leaderOf`; `laneColor`; `describePanel`.
  - The home "Continue game" card and `selectHasSavedGame` already exclude finished games.
- Known issues:
  - Until step 9 lands, finishing a game redirects to `/cribbage/game-over`, which is an "Unmatched Route" (the board is replaced, so back goes home). Do not ship step 8 alone.
  - Landscape phone at font scale 1.5: header buttons and panels take most of the height; the history is barely visible (it still scrolls). Consider capping the header button text scale in step 10.
  - Emulators here use software GL (see step 6); peg smoothness on a real device is still a step 10 item. The "Looks like you have configured linking in multiple places" dev toast appears after adb deep links (dev builds only).
- Updates made to later step plans: step 9 "Context from previous steps" (redirect already implemented, reusable history/leader helpers, route-test location); step 10 (known issues, QA matrix additions).

**Before ending:** update `step-09-game-over/plan.md` and `step-10-qa-and-release/plan.md`; commit `Cribbage step 8: board screen`.
