# Step 3 — Persisted store

Read [spades-plan.md](./spades-plan.md) first, then the Handoffs of [step 1](./spades-step-01.md) and [step 2](./spades-step-02.md).

## Context from previous steps
- Engine lives in `src/games/spades/engine` (see the Handoffs for the real API). `rebuildHands` **throws `InvalidHandError`** on an invalid entry — catch it in `updateHand` and in sanitize-on-hydrate. `createHandRecord`/`validateHand` do not know whether the game is already over — the store must reject `addHand` on a finished game.
- Reference implementation: `src/games/ginRummy/store/*` and `src/games/cribbage/store/*` (+ `createGinStore.test.ts` / `createCribbageStore.test.ts`). Mirror structure, `ActionResult`, `createSafeStorage` (`src/storage/safeStorage.ts`), sanitize-on-hydrate, `withHistory`, and WeakMap-memoised selectors (Zustand v5 needs stable selector results). Check cribbage's store Handoff (`docs/cribbage/step-02-store/plan.md`) for whether `ActionResult`/`GameStatus` were shared or redefined locally and do the same.

## Goal
A persisted `useSpadesStore` with the actions/selectors from the overview contract, including the draft-bids feature.

## Tasks
1. `types.ts`: `SpadesGame`, `DraftBid`, `SpadesState` (`currentGame`, `history`), `SpadesActions`, `SpadesStore`, `StartGameOptions`.
2. `persistence.ts`: `STORAGE_KEY = 'card-keeper/spades'`, `STORAGE_VERSION = 1`, `MAX_HISTORY = 20`, `deriveStatus`, `parseGame` (validate id/startedAt/4 string players/target ∈ {500,300,200}/blindNil boolean/firstDealer 0–3/hands shape/draftBids shape or null; rebuild hands via the engine; drop an unusable game; drop invalid drafts only), `sanitizePersistedState`, `migrateState`.
3. `createSpadesStore.ts` actions:
   - `startGame({ names, target, blindNil, firstDealer })` — blank names become "Player N"; replaces any current game; empty hands, `draftBids: null`.
   - `saveDraftBids(bids | null)` — fails when no game/finished; validates each non-null bid (kind, 1–13 / 0); `blindNil` rejected when disabled.
   - `addHand(input)` — fails when no game/finished/invalid; assigns id + number; clears `draftBids`; auto-finishes when the engine says the game is over and pushes to history.
   - `updateHand(id, input)` — rebuild all hands; truncation after a deciding hand; reopen the game (and remove it from history if it was auto-finished and is now undecided — mirror gin/cribbage behaviour exactly).
   - `undoLastHand()`, `finishGame()` (early end; requires ≥ 1 hand), `abandonGame()`, `clear()`.
   - History: finished games newest first, capped.
4. `selectors.ts`: memoised `selectHandResults`, `selectResult`; `selectTotals`, `selectBags`, `selectContext` (stable per game), `selectDealer` (derived from `hands.length + 1`), `selectHandNumber`, `selectIsGameOver`, `selectHasSavedGame` (true only for an `inProgress` game).
5. `index.ts`: `useSpadesStore = createSpadesStore(AsyncStorage)`, `useSpadesHydrated`, re-exports.
6. Tests with in-memory storage: start/add/update/undo, draft save/clear/validation, draft cleared on add, win by target, loss by floor, finish early, history cap, corrupt storage, hand-edited persisted hands, bad draft dropped but game kept, version migration passthrough, selector referential stability.

## Acceptance criteria
- Every action returns user-presentable error strings via `ActionResult`; corrupt/hand-edited storage never throws on hydrate.
- Selector tests prove stable references.

## Verify
`npm run lint && npm run typecheck && npm test -- spades`

## Handoff (fill in when done)
- Files created:
- Final store API (deviations from the overview contract):
- Behaviour notes (`updateHand` reopening a finished game, draft handling):
- Gotchas:
- Updates made to later step plans:

**Before ending:** update `spades-step-04.md` and `spades-step-05.md` with the real API (`startGame` options, `clear`, selectors) and commit `Spades step 3: store`.
