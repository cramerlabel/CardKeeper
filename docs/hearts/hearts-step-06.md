# Step 6 — Scoreboard components and history builder

Read [hearts-plan.md](./hearts-plan.md) first, then the Handoffs of steps [2](./hearts-step-02.md), [3](./hearts-step-03.md) and [4](./hearts-step-04.md) (especially the reuse verdict for `ScorePanel`/`HandHistory`/`GameMenu`).

## Context from previous steps
- Engine: `computeHandResults` (per-hand dealer, pass direction, raw/points, shooter, totals), `computeResult` (ranking, stats), `dealerOf`, `passDirectionOf`, `PASS_LABELS`; store selectors `selectHandResults`, `selectTotals`, `selectDealer`, `selectHandNumber`, `selectPassDirection`, `selectResult`.
- Reference UI: `src/features/scoreboard/{ScorePanel,HandHistory,GameMenu,history,useTextScale}.ts*` (+ `history.test.ts`), and Spades' `src/features/spadesScoreboard/*` if landed.
- No screen is built in this step — step 8 assembles these pieces. Build and unit-test the pure logic, and build the presentational components so they can be dropped into the screen.
- **Hearts is lowest-wins**: "leader" = lowest total; progress toward the target is a *danger* indicator (the closer to the target, the worse). Don't reuse gin's "progress to win" styling as-is.

## Goal
The reusable scoreboard building blocks for Hearts: four player score panels and a pure history builder.

## Tasks
1. Pure `src/features/heartsScoreboard/history.ts` (+ test): `buildHeartsHistory(handResults, players)` ⇒ rows newest first, each with hand number, dealer name, pass label, per-player `{ points (signed), total }`, who took the queen, and flags (`shooter?: PlayerIndex`, `cleanPlayers`). Also `rankPlayers(totals)` ⇒ per-player `{ rank, leading, tiedLeader }` (lowest total leads; ties share the rank), and `dangerLevel(total, target)` ⇒ `'none' | 'warning' | 'danger'` (e.g. ≥ 75 % / ≥ 90 % of the target; negative totals are always `none`; check the thresholds with the user-facing 50 and 150 targets). Tests: normal row, moon row (both rules), negative totals, ties for lead, empty list, danger thresholds.
2. `HeartsPlayerPanel` component (or generalise `ScorePanel` if step 4 judged it generic): name, big total, rank/leader crown for the lowest, dealer badge, a "progress to target" bar in warning/danger colours, optional "last hand +N" delta chip. Accessibility label summarising everything ("Alice: 42 points, leading, dealer"); 48dp targets; `maxFontSizeMultiplier`; must fit in a 2×2 grid at 360dp and in a single row on tablets (accept a `dense` prop like gin).
3. `PassDirectionBadge` / banner: "Hand 3 · Pass across" with an icon (arrows: left/right/across/none); also `DealerBadge` if not part of the panel.
4. `HeartsHistory` component: list from the builder; compact table — hand # / four points columns / (optional) totals line; icons for queen (♠ Q) and moon; each row tappable (`onPressHand(handId)`); scrolls independently (FlatList); empty state; column headers are the four names (truncated) and stay readable at font scale 1.3 on 360dp (reduce to initials/short names if necessary and document the rule).
5. Components must be theme-token only (`@/theme`), work from 320dp to tablet widths, and respect `useTextScale`.

## Acceptance criteria
- Pure builders fully tested; components typecheck and lint clean and render without a screen (add a render smoke test only if the repo already has component-test infrastructure, as `ErrorFallback.test.tsx` does).
- No gin/cribbage/spades visual change if shared components were generalised.
- Contrast test (`src/theme/contrast.test.ts`) still green; any warning/danger colours used on panels meet contrast on the card background.

## Verify
`npm run lint && npm run typecheck && npm test`

## Handoff (fill in when done)
- Files created/changed:
- Component props (final signatures):
- History row shape:
- Whether `ScorePanel` was reused or a separate panel built, and why:
- Gotchas:
- Updates made to later step plans:

**Before ending:** update `hearts-step-08.md` with the real component props; commit `Hearts step 6: scoreboard components`.
