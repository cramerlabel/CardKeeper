# Step 6 — `CribbageBoard` SVG component with animated pegs

Read [../plan.md](../plan.md) first, then the Handoff of [step 3](../step-03-board-geometry/plan.md) (and step 1 for `pegPositions`).

## Context from previous steps
- Geometry API from step 3 (`src/features/cribbageBoard/geometry.ts`): `buildBoard({ width, height, playerCount, config })` returns `BoardGeometry`; `pegPoint(board, lane, position)` clamps/interpolates a score; `pegPathPoints(board, lane, from, to)` returns sampled positions including endpoints and supports reverse/fractional moves. `LANE_COLOR_KEYS` is `['red', 'blue', 'green']`. `lanes[lane].holes[0]` is the start hole (just behind hole 1, on the track); `holes[1..target]` are score holes. `gameHole` is the center of the per-lane target holes, so render each lane's target from `lanes[lane].holes[target]`. This step also fixed the step 3 layout (the game hole used to sit on hole 1) and added `backStartPoints`, `dealerPoints`, `innerRadius` — see the step 3 Handoff.
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
  - New in `src/features/cribbageBoard/`: `CribbageBoard.tsx` (public component), `BoardSvg.tsx` (memoised static `Svg`), `PegLayer.tsx` (pegs + dealer badge), `pegMotion.ts` (pure peg/animation helpers), `boardLayout.ts` (pure SVG/label/a11y helpers), `laneColors.ts`, `useReduceMotion.ts`; tests `pegMotion.test.ts`, `boardLayout.test.ts`, `CribbageBoard.test.tsx`.
  - Changed: `geometry.ts` + `geometry.test.ts` (step 3 bug fix and additions, see below), `src/theme/colors.ts`, `src/theme/contrast.test.ts`.
  - Screenshots: `docs/qa/cribbage-board-{phone-portrait,phone-landscape,phone-compact,tablet-portrait,tablet-landscape}-*.png` (Pixel 7 and Pixel Tablet emulators, API 35). The temporary harness route was deleted.
- Final component props and exported helpers:
  - `import { CribbageBoard, type CribbageBoardProps } from '@/features/cribbageBoard/CribbageBoard'` with `{ pegs: PegPosition[]; playerNames: string[]; config: CribbageConfig; dealer?: PlayerIndex; style?: StyleProp<ViewStyle>; animate?: boolean /* default true */ }`. `pegs` is `selectPegs` output (`front` is also the total shown in the accessibility label). The component is `flex: 1` and fills whatever box it is given (measured with `onLayout`); it draws nothing until measured and nothing if the box is too small (no crash).
  - Also exported: `laneColor(lane)` / `LANE_COLORS` (`@/features/cribbageBoard/laneColors`, for matching player-panel swatches to the lane/peg colour), `describeBoard`, `skunkLines`, `showSkunkLabels`, `holesPathData`, `polylinePathData` (`boardLayout.ts`), `initialPegSlots`, `planPegMoves`, `moveDurationMs`, `laneKeyframes`, `trackPositions`, `BACK_START_POSITION`, `MIN/MAX_MOVE_MS` (`pegMotion.ts`), `useReduceMotion`.
  - Geometry additions (`geometry.ts`): `BoardGeometry.backStartPoints`, `dealerPoints`, `innerRadius`, and `DEALER_BADGE_RADIUS_RATIO`.
- Theme tokens added: `boardWood`, `boardRim`, `boardHole`, `boardLine`, `pegRed`, `pegBlue`, `pegGreen` (contrast tests in `contrast.test.ts`: lane colours >= 3:1 on the wood and on a hole, skunk labels >= 4.5:1, rim >= 3:1 on the felt).
- Preferred minimum size for readable play: **3 players >= 360x370 dp** (smallest hole gap 4.8 dp; pegs are 18 dp so neighbouring pegs overlap, the player panels carry the exact totals); 340x260 is workable (3.1 dp gaps), 340x200 is cramped (1.8 dp). **2 players >= 300x180 dp** (3.2 dp gaps); 280x140 is cramped. Skunk labels are hidden when the innermost lane's radius is under 28 dp (3 players ~320x190 and smaller, 2 players ~260x120), but the lines stay. Boxes smaller than ~3 players 300x160 / 2 players 240x100 render nothing. A board is vertical when its box is taller than wide, otherwise horizontal; a near-square box gives a near-circular track. Lanes are capped at 30 dp apart, so bigger boxes (tablets) only enlarge pegs (max radius 10 dp) and holes and leave an empty middle.
- Gotchas (svg, animation, performance):
  - **Step 3 geometry bug fixed here**: the track was a closed loop, so `holes[target]` coincided exactly with `holes[1]` and the start hole sat ~3 dp from hole 120. Now the scoring track stops short of a tail gap that holds the game hole, a dealer-badge slot and two start holes. `holes[0]` (start) and the new `backStartPoints[lane]` (second start hole) are on the track just behind hole 1. Holes are also now aligned radially across lanes (spacing on the end arcs shrinks with lane radius) so skunk lines are straight across all lanes; see the step 3 Handoff.
  - **Pegs are `Animated.View`s overlaid on the SVG, not SVG elements**: `react-native-svg` props cannot use the native driver. Each physical peg has one `Animated.Value` holding its *track position* (-1 = second start hole, 0 = start, 1..target); `x`/`y` are interpolated through `laneKeyframes` (identical to the `pegPathPoints` route), so a move needs no React renders per frame and no JS-thread work (`useNativeDriver: true`). A peg also scales up to 1.45x while it travels. Moves are only started from an effect after a state change; the first render places pegs directly (no animation from 0).
  - **Leapfrog is real**: pegs are tracked by identity (`planPegMoves`): the assignment with the least travel wins, ties prefer moving one peg, so a normal score moves only the old back peg ahead (it turns solid/front immediately and the old front turns hollow/back in place). Undo reverses it. Edits that change both pegs move both. A back peg of 0 waits in the second start hole.
  - Front peg = solid lane colour with a light ring; back peg = dark hollow ring in the lane colour.
  - **Key the board by game id** (`<CribbageBoard key={game.id} .../>`), otherwise starting a new game on a mounted board animates the pegs back to the start.
  - `animate={false}` or the OS reduce-motion setting (`AccessibilityInfo.isReduceMotionEnabled` + `reduceMotionChanged`) makes pegs jump (verified on the emulator with `transition_animation_scale 0`).
  - The static layer (`BoardSvg`) is `memo`ed on the geometry object, which is memoised on size/player count/target/skunk lines (so a fresh `config` object each render is fine). Dealer changes and score changes do not redraw it. The 121 holes per lane are drawn as one `Path` each (not 121 views).
  - Dealer badge and pegs are outside the SVG so they never trigger an SVG redraw; both layers are hidden from the accessibility tree and the container is a single `accessible` `image` with the label from `describeBoard`.
  - Jest: `NativeAnimatedModule` is a no-op mock, so `CribbageBoard.test.tsx` forces the JS driver by spying on `NativeAnimatedHelper.shouldUseNativeDriver`; copy that pattern when testing screens that animate pegs.
  - Performance check: the emulators here render with SwiftShader (software GL) so absolute frame times are not meaningful (~85-95 ms/frame with *or without* the static SVG, i.e. the static layer costs ~8 ms). Animations are native-driven with no per-frame React work. A real mid-range device pass is still worth doing in step 10.
- Updates made to later step plans: step 3 Handoff (geometry changes), step 8 and step 9 "Context from previous steps" (real props, keying, sizes), step 10 (real-device perf check).

**Before ending:** update `step-08-board-screen/plan.md` and `step-09-game-over/plan.md` with the real props; commit `Cribbage step 6: board component`.
