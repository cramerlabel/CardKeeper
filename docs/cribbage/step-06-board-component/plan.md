# Step 6 — `CribbageBoard` SVG component with animated pegs

Read [../plan.md](../plan.md) first, then the Handoff of [step 3](../step-03-board-geometry/plan.md) (and step 1 for `pegPositions`).

## Context from previous steps
- Geometry API from step 3 (`src/features/cribbageBoard/geometry.ts`): `buildBoard({ width, height, playerCount, config })` returns `BoardGeometry`; `pegPoint(board, lane, position)` clamps/interpolates a score; `pegPathPoints(board, lane, from, to)` returns sampled positions including endpoints and supports reverse/fractional moves. `LANE_COLOR_KEYS` is `['red', 'blue', 'green']`. `lanes[lane].holes[0]` is the off-track start; `holes[1..target]` are score holes. `gameHole` is the center of the per-lane target holes, so render each lane's target from `lanes[lane].holes[target]`.
- `react-native-svg` installed (step 1). Check SDK 58 docs for its API before use: `https://docs.expo.dev/versions/v58.0.0/sdk/svg/`.
- Peg data comes from `pegPositions(events, ctx)` = `{ front, back }[]` per player (selector `selectPegs`).
- No screen consumes this yet (step 8 does). Verify with unit tests plus a **temporary** dev harness (e.g. a throwaway route you delete before committing, or a Jest render test) — do not leave harness code in the repo.

## Goal
A reusable, accessible, animated board component: `src/features/cribbageBoard/CribbageBoard.tsx`.

## Tasks
1. Theme: add board/peg colours to `src/theme/colors.ts` (wood board, hole, line, 3 lane/peg colours with sufficient contrast against the board). Extend `src/theme/contrast.test.ts` for the new pairs.
2. Props: `{ pegs: {front, back}[]; playerNames: string[]; config: CribbageConfig; dealer?: PlayerIndex; style?; animate?: boolean }`. Size from `onLayout` of its container (fills available space; keep aspect via geometry orientation).
3. Rendering (single `Svg`, memoised static layer so pegs updates do not redraw 360+ holes): board background, lane tracks, holes (grouped by 5), start holes, game hole, skunk and double-skunk lines with small labels, dealer marker (e.g. small "D" badge at the dealer's start area).
4. Pegs: two per player (front bright, back dimmer/outlined) in lane colour. Animation with RN `Animated` (native driver where supported) or Reanimated only if already a dependency — **do not add Reanimated**; follow `pegPathPoints` for the route so the peg moves along the track around the ends; leapfrog = the old back peg jumps ahead to the new front position while the old front becomes the back. Duration scales with distance, capped (~600ms). Respect `AccessibilityInfo.isReduceMotionEnabled` (jump immediately). First render must not animate from 0.
5. Accessibility: container `accessible` with a label like "Cribbage board. Alice 87, Bob 79. Alice is dealing." Individual SVG pieces hidden from the accessibility tree.
6. Pure helper tests (e.g. `pegMotion.test.ts`): which peg moves on a change, duration function, reduce-motion path, no-animation on mount.
7. Performance: check on a mid-range emulator that adding a score keeps the UI responsive (no per-frame React re-render of the whole board).

## Acceptance criteria
- 2- and 3-player boards render correctly in portrait and landscape and for 121 and 61 targets; skunk lines visible.
- Pegs animate along the track and the leapfrog is visually clear; with reduce motion they jump.
- Screenshots of the temporary harness at phone portrait/landscape and tablet saved to `docs/qa/` (e.g. `cribbage-board-*.png`).
- Harness removed; lint/typecheck/tests green.

## Verify
`npm run lint && npm run typecheck && npm test`; visual check on emulator.

## Handoff (fill in when done)
- Files created/changed:
- Final component props and exported helpers:
- Theme tokens added:
- Preferred minimum size for readable play:
- Gotchas (svg, animation, performance):
- Updates made to later step plans:

**Before ending:** update `step-08-board-screen/plan.md` and `step-09-game-over/plan.md` with the real props; commit `Cribbage step 6: board component`.
