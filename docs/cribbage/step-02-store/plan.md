# Step 2 — Persisted store

Read [../plan.md](../plan.md) first, then the Handoff of [step 1](../step-01-engine/plan.md).

## Context from previous steps
- Engine lives in `src/games/cribbage/engine` (see step 1 Handoff for the real API).
- Reference implementation: `src/games/ginRummy/store/{types,persistence,selectors,createGinStore,index}.ts` and `createGinStore.test.ts`. Mirror structure, error handling (`ActionResult`), `createSafeStorage`, sanitize-on-hydrate, memoised selectors (Zustand v5 requires stable selector results).

- Real engine API (step 1): `rebuildEvents(entries: ScoreEntry[], ctx)` takes `{ id, input }` entries and **throws `InvalidScoreError`** on an invalid entry (catch it in `updateScore` and in sanitize-on-hydrate). `createScoreEvent`/`validateScore` do not check for a finished game — the store must reject `addScore` when finished. `ERROR_*` message constants are exported for UI use. `react-native-svg` 15.16.0 is installed.

## Goal
A persisted `useCribbageStore` with the actions/selectors from the overview contract.

## Tasks
1. `types.ts`: `CribbageGame`, `CribbageState` (`currentGame`, `history`), `CribbageActions`, `CribbageStore`, re-export/define `ActionResult`/`GameStatus` (reuse gin's types if cleanly shareable, otherwise redefine locally).
2. `persistence.ts`: `STORAGE_KEY = 'card-keeper/cribbage'`, `STORAGE_VERSION = 1`, `MAX_HISTORY = 20`, `deriveStatus`, `parseGame` (validate id/startedAt/players length 2–3 of strings/target 121|61/firstDealer in range/deal >= 1/events shape; rebuild events via engine; drop game if unusable), `sanitizePersistedState`, `migrateState`.
3. `createCribbageStore.ts` with actions:
   - `startGame({names, target, firstDealer})` (default names "Player N"; deal = 1).
   - `addScore(input)` – input deal defaults to the current deal; fails when no game / finished / invalid; auto-finishes when target reached.
   - `updateScore(id, input)` – rebuild all events; truncation after win; reopen game if it no longer finished.
   - `deleteScore(id)`, `undoLastScore()`.
   - `nextDeal()` – increments `deal` (fails when finished).
   - `finishGame()` (ends early; requires at least one event), `abandonGame()`, `clear()`.
   - Keep `deal` consistent after delete/undo: never below the max `deal` of remaining events.
   - History: finished games newest first, capped, same `withHistory` approach as gin.
4. `selectors.ts`: memoised (WeakMap by events array) `selectTotals`, `selectPegs`, `selectResult`; `selectDealer`, `selectContext` (stable object per game), `selectIsGameOver`, `selectHasSavedGame`.
5. `index.ts`: `useCribbageStore = createCribbageStore(AsyncStorage)`, `useCribbageHydrated`, re-exports.
6. Tests mirroring `createGinStore.test.ts` with in-memory storage: start/add/update/delete/undo/nextDeal, win detection, finish early, history cap, corrupt storage, hand-edited events, version migration passthrough, selector referential stability.

## Acceptance criteria
- All actions return `ActionResult` with user-presentable error strings.
- Corrupt/hand-edited storage never throws on hydrate.
- Selector tests prove stable references (no zustand infinite-render risk).

## Verify
`npm run lint && npm run typecheck && npm test -- cribbage`

## Handoff (fill in when done)
- Files created:
- Final store API (actions, selectors, hooks) and deviations from the contract:
- Behaviour notes (deal handling on delete/undo, auto-finish, history):
- Gotchas:
- Updates made to later step plans:

**Before ending:** update `step-04`, `step-05`, `step-07`, `step-08`, `step-09` plans with the real store API; commit `Cribbage step 2: store`.
