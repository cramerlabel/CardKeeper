# Step 3 — Persisted store

Read [hearts-plan.md](./hearts-plan.md) first, then the Handoffs of [step 1](./hearts-step-01.md) and [step 2](./hearts-step-02.md).

## Context from previous steps
- Engine lives in `src/games/hearts/engine` (see the Handoffs for the real API). `rebuildHands` **throws `InvalidHandError`** on an invalid entry — catch it in `updateHand` and in sanitize-on-hydrate. `createHandRecord`/`validateHand` do not know whether the game is already over — the store must reject `addHand` on a finished game.
- Reference implementation: `src/games/ginRummy/store/*` and `src/games/cribbage/store/*` (+ `createGinStore.test.ts` / `createCribbageStore.test.ts`); and, if landed, `src/games/spades/store/*` (identical structure minus drafts/bags). Mirror structure, `ActionResult`, `createSafeStorage` (`src/storage/safeStorage.ts`), sanitize-on-hydrate, `withHistory`, and WeakMap-memoised selectors (Zustand v5 needs stable selector results). Check the cribbage/spades store Handoffs for whether `ActionResult`/`GameStatus` were shared or redefined locally and do the same.

## Goal
A persisted `useHeartsStore` with the actions/selectors from the overview contract.

## Tasks
1. `types.ts`: `HeartsGame`, `HeartsState` (`currentGame`, `history`), `HeartsActions`, `HeartsStore`, `StartGameOptions`.
2. `persistence.ts`: `STORAGE_KEY = 'card-keeper/hearts'`, `STORAGE_VERSION = 1`, `MAX_HISTORY = 20`, `deriveStatus`, `parseGame` (validate id/startedAt/4 string players/target ∈ {50,100,150}/moonRule ∈ the two values/firstDealer 0–3/hands shape; rebuild hands via the engine; drop an unusable game), `sanitizePersistedState`, `migrateState`.
3. `createHeartsStore.ts` actions:
   - `startGame({ names, target, moonRule, firstDealer })` — blank names become "Player N"; replaces any current game; empty hands.
   - `addHand(input)` — fails when no game/finished/invalid; assigns id + number; auto-finishes when the engine says the game is over and pushes to history.
   - `updateHand(id, input)` — rebuild all hands; truncation after a deciding hand; reopen the game (and remove it from history if it was auto-finished and is now undecided — mirror gin/cribbage/spades behaviour exactly).
   - `undoLastHand()`, `finishGame()` (early end; requires ≥ 1 hand), `abandonGame()`, `clear()`.
   - History: finished games newest first, capped.
4. `selectors.ts`: memoised `selectHandResults`, `selectResult`; `selectTotals`, `selectContext` (stable per game), `selectDealer` (from `hands.length + 1`), `selectHandNumber`, `selectPassDirection` (for the *next* hand), `selectIsGameOver`, `selectHasSavedGame` (true only for an `inProgress` game).
5. `index.ts`: `useHeartsStore = createHeartsStore(AsyncStorage)`, `useHeartsHydrated`, re-exports.
6. Tests with in-memory storage: start/add/update/undo, win by target (unique lowest), **tie for lowest keeps the game in progress**, finish early, history cap, corrupt storage, hand-edited persisted hands, invalid moon rule/target dropped, version migration passthrough, selector referential stability.

## Acceptance criteria
- Every action returns user-presentable error strings via `ActionResult`; corrupt/hand-edited storage never throws on hydrate.
- Selector tests prove stable references.

## Verify
`npm run lint && npm run typecheck && npm test -- hearts`

## Handoff (fill in when done)
- Files created:
- Final store API (deviations from the overview contract):
- Behaviour notes (`updateHand` reopening a finished game, early finish):
- Gotchas:
- Updates made to later step plans:

**Before ending:** update `hearts-step-04.md` and `hearts-step-05.md` with the real API (`startGame` options, `clear`, selectors) and commit `Hearts step 3: store`.
