# Step 3 — Game registry, state and persistence

## Context
See `step-0.md` (overview) and `step-2.md` handoff (engine API).

**Engine API (from Step 2)** — import from `@/games/ginRummy/engine`:
- Types: `PlayerId = 0|1`, `HandKind = 'knock'|'gin'|'bigGin'`, `HandOutcome = 'knock'|'undercut'|'gin'|'bigGin'`, `HandInput { knocker; kind; deadwood: [n,n] }`, `HandResult { winner; points; outcome }`, `HandRecord = HandResult & { id: string; number: number (1-based); input: HandInput }`, `Pair = [number, number]`, `ScoringConfig`, `FinalScore`.
- Functions: `validateHandInput(input) → string[]` (use for form errors), `createHandRecord(id, number, input)` (throws `InvalidHandError` with `.errors`) — use it in `addHand`/`updateHand`; `computeTotals(hands)`, `handsWon(hands)`, `isGameOver(totals)`, `gameWinner(hands)`, `computeFinalScore(hands)` → `{ winner, finalLeader, raw, handsWon, boxBonus, gameBonus, shutout, final }`. `DEFAULT_SCORING_CONFIG`.
- Persistence: persist `HandRecord[]` as plain JSON (it is). On `updateHand`/`undoLastHand` recompute every record with `createHandRecord` (keeping ids, renumbering `number`) rather than patching points. If an edit changes when the game ends, re-derive status from `isGameOver(computeTotals(hands))`; the engine does not stop at game end, so truncation/rejection of hands after the winning hand is the store's job (reject `addHand` when already over).
- `computeFinalScore` returns `winner: null` until the game is over.

## Goal
A game registry (so new games plug in) and a persisted Gin Rummy game store with auto-save/resume.

## Tasks
1. `src/games/types.ts`: `GameDefinition { id; name; description; icon; playerCount; available: boolean; route(s) }`.
2. `src/games/registry.ts`: array/map with Gin Rummy (available) and 2–3 "coming soon" placeholders (e.g. Hearts, Spades, Euchre) with `available: false`.
3. Gin Rummy store (Zustand + `persist` middleware with AsyncStorage), state:
   ```
   currentGame: { id, startedAt, players: [name,name], hands: HandRecord[], status: 'inProgress'|'finished' } | null
   actions: startGame(names), addHand(input), updateHand(id,input), undoLastHand(), finishGame(), abandonGame(), clear()
   selectors: totals, handsWon, isGameOver, finalScore (via engine)
   ```
   `addHand` validates via the engine; when `isGameOver`, status becomes `finished`.
4. Persist schema version + migration stub; handle corrupt/missing storage gracefully.
5. Optional: keep a short history of finished games (last ~20) for later stats; keep it simple.
6. Tests: store actions with an in-memory storage mock (undo, edit, game completes at ≥100, resume restores state).

## Acceptance criteria
- Tests pass; killing/restarting the app restores an in-progress game (verify in Step 5/6 UI).
- Adding a new game requires only a registry entry and a game module.

## Handoff notes (fill in when done)
- Store file path, hook names (e.g. `useGinStore`), selectors: _TBD_
- Update `step-4.md` with: registry shape, how to detect a saved in-progress game.
