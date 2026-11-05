# Step 6 — Scoreboard components and history builder

Read [spades-plan.md](./spades-plan.md) first, then the Handoffs of steps [2](./spades-step-02.md), [3](./spades-step-03.md) and [4](./spades-step-04.md) (especially the reuse verdict for `ScorePanel`/`HandHistory`/`GameMenu`).

## Context from previous steps
- Engine: `computeHandResults` (per-hand points, bag deltas, penalties, running totals/bags), `computeBags`, `dealerOf`, `teamPlayers`; store selectors `selectHandResults`, `selectTotals`, `selectBags`, `selectDealer`, `selectHandNumber`, `selectResult`; `currentGame.draftBids`.
- Reference UI: `src/features/scoreboard/{ScorePanel,HandHistory,GameMenu,history,useTextScale}.ts*` (+ `history.test.ts`).
- No screen is built in this step — step 8 assembles these pieces. Build and unit-test the pure logic, and build the presentational components so they can be dropped into the screen.

## Goal
The reusable scoreboard building blocks for Spades: team score panels with bags and contract info, and a pure history builder.

## Tasks
1. Pure `src/features/spadesScoreboard/history.ts` (+ test): `buildSpadesHistory(handResults, players)` => rows newest first, each row with hand number, dealer name, per-team `{ bid label ("7", "6+Nil"), tricks, points (signed), bagPenalty?, runningTotal, bags }`, per-player nil/blind-nil badges (made/failed), and flags (`missedContract`, `bagPenalty`). Tests: made/missed, nil made/failed, blind nil, bag penalty row, running totals, empty list.
2. Pure `src/features/spadesScoreboard/contracts.ts` (+ test): `describeContract(draftBids, team)` => text for the in-hand contract from saved draft bids ("Bid 7", "Nil + 4", "Waiting for bids"), plus `teamBidTotal`, and "total bids vs 13" hint helper (overbid/underbid text, informational only).
3. `SpadesTeamPanel` component (or generalise `ScorePanel` if step 4 judged it generic): team label (both names), total score, leader highlight, a **bag meter** (10 pips, filled = bags carried, warning colour at 8–9), contract line from `describeContract`, dealer badge next to the dealer's name when that player is on the team, near-target/near-floor indicator (progress toward target; danger style when ≤ floor + 50). Accessibility label summarising everything; 48dp targets; `maxFontSizeMultiplier`.
4. `SpadesHistory` component: list from the builder; each row is tappable (`onPressHand(handId)`), shows both teams' bid/tricks/points/running total, nil badges, bag-penalty chip; scrolls independently (FlatList). Empty state text.
5. Components must be theme-token only (`@/theme`), work from 320dp to tablet widths, and respect `useTextScale`.

## Acceptance criteria
- Pure builders fully tested; components typecheck and lint clean and render without a screen (add at least a render smoke test only if the repo already has component-test infrastructure, as `ErrorFallback.test.tsx` does).
- No gin/cribbage visual change if shared components were generalised.

## Verify
`npm run lint && npm run typecheck && npm test`

## Handoff (fill in when done)
- Files created/changed:
- Component props (final signatures):
- History row shape:
- Whether `ScorePanel` was reused or a separate panel built, and why:
- Gotchas:
- Updates made to later step plans:

**Before ending:** update `spades-step-08.md` with the real component props; commit `Spades step 6: scoreboard components`.
