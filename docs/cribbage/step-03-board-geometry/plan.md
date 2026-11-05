# Step 3 — Board geometry (pure math)

Read [../plan.md](../plan.md) first, then the Handoff of [step 1](../step-01-engine/plan.md). Independent of the store (step 2) — may run before or after it.

## Context from previous steps
- `CribbageConfig` (`target`, `skunkLine`, `doubleSkunkLine`) and `PlayerCount` come from `@/games/cribbage/engine`.
- Real engine API (step 1): `pegPositions` returns `PegPosition[]` (`{ front, back }`, front capped at `target`, back = 0 when off-board); `CribbageConfig.doubleSkunkLine` is `null` for the short game (61), so draw only the skunk line at 31 then. Config helpers: `getConfig(121 | 61)`, `STANDARD_CONFIG`, `SHORT_CONFIG`.
- No UI in this step: geometry is pure TypeScript so it can be tested without rendering. Put it in `src/features/cribbageBoard/geometry.ts` (+ `geometry.test.ts`).

## Goal
Compute everything needed to draw a continuous racetrack cribbage board and move pegs along it, for any available width/height.

## Design
- Board = one concentric **stadium** (rounded rectangle with semicircular ends) track per player (2 or 3 lanes), plus the start area and game hole.
- Orientation: long axis along the larger of width/height (portrait => vertical, landscape => horizontal). Geometry is computed in a normalised coordinate system for a horizontal board and rotated/transposed for vertical.
- Hole index `0..target`: `0` = start position (off the track, before hole 1), `1..target-1` = holes, `target` = game hole at the end of the track. Holes are evenly spaced by arc length along each lane, with a larger gap after every 5th hole.
- Skunk lines (`skunkLine`, `doubleSkunkLine`) are drawn between holes at those indices across all lanes.
- Hole radius, lane spacing and peg radius derive from available space with sensible minimums (peg diameter >= 14dp, otherwise holes shrink first).

## Tasks
1. `buildBoard({ width, height, playerCount, config })` returning
   `{ orientation, width, height, laneCount, holeRadius, pegRadius, lanes: { holes: Point[] }[], startPoints: Point[], gameHole: Point, skunkMarks: { index: number; kind: 'skunk'|'doubleSkunk'; from: Point; to: Point }[], groupSeparators? }`.
2. `pegPoint(board, lane, position)` (position clamps to 0..target) and `pegPathPoints(board, lane, from, to)` giving the sampled holes between positions so animation can follow the curve (including direction around the ends).
3. Lane order & colours: expose `LANE_COLOR_KEYS = ['red','blue','green']`-style keys only (actual colours are added to the theme in step 6).
4. Tests: hole count = target + 1 per lane; holes lie on the lane path; monotonic progress along the track; 5-hole grouping gaps; skunk marks between correct holes for 121 and 61 games; portrait vs landscape orientation swap; lanes never overlap and all points fall inside the box for several sizes (small phone 320x480, phone 360x780, tablet 800x1280, landscape variants) for 2 and 3 players; `pegPoint` clamping; `pegPathPoints` for forward and zero-length moves.

## Acceptance criteria
- Deterministic pure functions, no React/RN imports.
- Works for `target` 121 and 61 (61 game uses the same board footprint with the second lap holes absent or the track resized — decide, document in Handoff, and keep skunk marks correct).
- All points inside the bounds for every tested size.

## Verify
`npm run lint && npm run typecheck && npm test -- cribbageBoard`

## Handoff (fill in when done)
- Files created: `src/features/cribbageBoard/geometry.ts`, `geometry.test.ts`.
- Final geometry API: `LANE_COLOR_KEYS` (`['red', 'blue', 'green']`), `buildBoard({ width, height, playerCount, config })`, `pegPoint(board, lane, position)`, and `pegPathPoints(board, lane, from, to)`. Types exported: `LaneColorKey`, `BoardOrientation`, `Point`, `BoardLane`, `SkunkMark`, `BoardGeometry`, and `BuildBoardOptions`.
- How the 61-point game is laid out: it uses the same one-lap stadium footprint with 61 score holes (plus the start point) distributed around the track. The wider spacing increases the hole radius; there is no second lap.
- Hole/peg size minimums chosen: peg radius is at least 7dp (14dp diameter), scaling up to 10dp; holes shrink with spacing and have a 1dp minimum radius.
- Gotchas: `lanes[*].holes[0]` is the off-track start point and indices `1..target` are the score holes. `gameHole` is the center of the per-lane target holes; peg destinations are `lanes[lane].holes[target]`. Both peg helpers clamp out-of-range positions; `pegPathPoints` also supports reverse and fractional positions. Invalid/non-fitting dimensions throw `RangeError`.
- Updates made to later step plans: step 6 now records the real geometry API and target-hole semantics.
- **Changes made later in step 6 (geometry bug fix)**: the original layout was a *closed* loop, so `holes[target]` was identical to `holes[1]` and the start hole sat ~3 dp from hole 120. `buildBoard` now reserves a tail gap (`8 x pegRadius`, sized for the innermost lane) between the game hole and hole 1 that holds the game hole, a dealer-badge slot and two start holes. `holes[0]` (start) is now on the track just behind hole 1 (still not a score hole). New fields: `backStartPoints` (second start hole where the waiting back peg sits), `dealerPoints` (badge slot per lane), `innerRadius`, and exported `DEALER_BADGE_RADIUS_RATIO`. Holes are mapped through the outermost lane's distance so they line up radially across lanes (spacing on the end arcs shrinks with lane radius), which makes skunk lines straight across all lanes. Skunk marks still reference `lanes[*].holes[index]`; the board component draws the line between holes `index - 1` and `index`. All earlier tests still pass; new tests cover the tail-gap clearances and radial alignment.

**Before ending:** update `step-06-board-component/plan.md` with the real API; commit `Cribbage step 3: board geometry`.
