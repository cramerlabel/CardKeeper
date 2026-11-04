# Step 1 — Dependency + scoring engine

Read [../plan.md](../plan.md) first (decisions, rules, contracts, session protocol).

## Context from previous steps
None. Reference implementation to mirror: `src/games/ginRummy/engine/*` (types/config/scoring/game/index + tests).

## Goal
Install `react-native-svg` and build the pure, fully tested cribbage engine under `src/games/cribbage/engine/`.

## Tasks
1. `npx expo install react-native-svg` (SDK-compatible version). Confirm it appears in `package.json`/lockfile; run `npx expo-doctor` and note any warnings. Do **not** edit `android/`.
2. `types.ts`, `config.ts`: types from the overview contract; `STANDARD_CONFIG`, `SHORT_CONFIG`, `getConfig`, plus constants `MAX_EVENT_POINTS = 29`, `HEELS_POINTS = 2`, `SCORE_KINDS` (ordered list with display labels, e.g. `{ kind, label, hint }`) for UI reuse.
3. `game.ts`: `dealerOf`, `InvalidScoreError`, `validateScore` (collect all errors: integer 1–29, player in range, deal >= 1, `heels` => exactly 2 and by dealer, `crib` => by dealer), `createScoreEvent`, `rebuildEvents` (recompute each entry in order, renumber, stop after the event that wins the game).
4. `scoring.ts`: `computeTotals` (capped at target), `isGameOver`, `computeResult` (winner = first to target, null otherwise; per-player skunk level based on config lines, evaluated only for non-winners; margin = winner total − best opponent total, 0 when no winner), `pegPositions`.
5. `index.ts` barrel re-exporting the public API.
6. Tests (`*.test.ts`): validation matrix, dealer rotation for 2 and 3 players, capping/overshoot, game ends on exact and overshoot, rebuild truncation + renumbering, skunk/double-skunk boundaries (90 vs 91, 60 vs 61; short game 30 vs 31), 3-player skunk per loser, peg back/front for first event, multiple events, other players' events, after edit.

## Acceptance criteria
- `react-native-svg` installed via expo install; `npm run typecheck` and `npm test` green.
- Engine has no React/RN imports and is deterministic.
- Test coverage of every exported function, including all validation errors.

## Verify
`npm run lint && npm run typecheck && npm test -- cribbage`

## Handoff (fill in when done)
- Installed `react-native-svg` version: `15.16.0` (pinned by `npx expo install`; native module => dev/release build must be rebuilt). `npx expo-doctor` only reports pre-existing patch-version mismatches (expo, expo-router, react-native, ...), unrelated to this step.
- Files created: `src/games/cribbage/engine/{types,config,game,scoring,index}.ts`, `game.test.ts`, `scoring.test.ts` (100% coverage of config/game/scoring).
- Final exported API (matches the overview contract; additions marked +): `STANDARD_CONFIG`, `SHORT_CONFIG`, `getConfig`, `MAX_EVENT_POINTS`, `HEELS_POINTS`, `SCORE_KINDS` (`{kind,label,hint}[]`), `dealerOf`, `InvalidScoreError`, `validateScore`, `createScoreEvent`, `rebuildEvents`, `computeTotals`, `isGameOver`, `computeResult`, `pegPositions`; + `ERROR_*` message constants; types + `ScoreEntry` (`{id, input}`), `PegPosition` (`{front, back}`), `GameResult`, `SkunkLevel`, `ScoreKindInfo`.
- Validation error message strings the UI can show (exported constants; `validateScore` returns all that apply, in this order):
  - `ERROR_POINTS_RANGE`: "Points must be a whole number from 1 to 29."
  - `ERROR_PLAYER_RANGE`: "Choose a valid player."
  - `ERROR_DEAL`: "Deal must be a whole number of 1 or more."
  - `ERROR_HEELS_POINTS`: "His heels is always 2 points."
  - `ERROR_HEELS_DEALER`: "Only the dealer scores his heels."
  - `ERROR_CRIB_DEALER`: "Only the dealer scores the crib."
- Gotchas / decisions:
  - `createScoreEvent`/`validateScore` do not check whether the game is already over; the store must reject adds after a win.
  - `rebuildEvents` throws `InvalidScoreError` on an invalid entry (it does not skip it); the store's sanitize/update paths must catch this.
  - `computeTotals` caps each player at the target but does not drop events after a win (use `rebuildEvents` for that); `computeResult.winner` is the first player to reach the target in event order.
  - `pegPositions` front peg is capped at the target; `back` is the (capped) total before the player's last event, 0 when none.
  - Short game: `doubleSkunkLine` is `null` => `skunk` is never `doubleSkunk`.
- Updates made to later step plans: added real-API notes to the "Context from previous steps" of steps 2 and 3.

**Before ending:** update `step-02-store/plan.md` and `step-03-board-geometry/plan.md` ("Context from previous steps") with the real API; commit `Cribbage step 1: engine and svg dependency`.
