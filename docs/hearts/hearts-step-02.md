# Step 2 — Engine: game aggregation (totals, outcome, result, stats)

Read [hearts-plan.md](./hearts-plan.md) first, then the Handoff of [step 1](./hearts-step-01.md).

## Context from previous steps
- `src/games/hearts/engine/{types,config,players,scoring,index}.ts` exist with `validateHand`, `scoreHand`, `getConfig`, `dealerOf`, `passDirectionOf` (see the step 1 Handoff for the real API and `ERROR_*` constants).
- Reference for rebuild/aggregate patterns: `src/games/cribbage/engine/{game,scoring}.ts` (`rebuildEvents` throws `InvalidScoreError` on an invalid entry and truncates after the winning event; `computeResult`), the gin engine, and — if landed — `src/games/spades/engine/{game,scoring}.ts` (same `rebuildHands`/`computeHandResults`/`computeResult` shape).

## Goal
Everything that depends on the sequence of hands: running totals, the lowest-wins game-over rule with the tie-break, the result summary, per-player stats, and hand rebuilding for edits.

## Tasks
1. `game.ts`:
   - `InvalidHandError` (with `errors: string[]`), `createHandRecord(id, number, input, config)` (throws on `validateHand` errors).
   - `rebuildHands(entries: { id, input }[], ctx)`: recompute in order, renumber from 1, **stop after the hand that decides the game**, throw `InvalidHandError` on an invalid entry (the store must catch it).
2. `scoring.ts` additions:
   - `computeHandResults(hands, ctx): HandResult[]` — per hand `{ id, number, dealer, pass, raw, points, shooter, totalsAfter }`.
   - `computeTotals(hands, ctx): [n,n,n,n]` (`[0,0,0,0]` for no hands).
   - `getOutcome(totals, config)` (pure; used by `isGameOver`, `computeResult`, `rebuildHands`): over iff `max ≥ target` and the minimum is held by exactly one player; returns `{ over, winner }`.
   - `isGameOver(hands, ctx)`.
   - `computeResult(hands, ctx)` → `{ winner, ranking, totals, margin, handsPlayed, stats }`. `ranking` lists all four players ordered by total ascending with competition ranks (ties share a rank, e.g. 1,2,2,4); `margin` = runner-up total − winner total (0 when no winner); `stats: PlayerStats[4]` = `{ moons, queens, heartsTaken, cleanHands, bestHand, worstHand }` (`cleanHands` = hands where that player scored 0 *or less*; `best/worstHand` = lowest/highest single-hand points, `null` when no hands; a moon victim's 26 counts as worst). `winner` is `null` when no hand has decided the game (callers present an early finish as "leader by lowest score", which may itself be tied).
3. `index.ts`: re-export the full public API.
4. Tests: running totals over several hands; dealer/pass rotation in `HandResult`; `getOutcome` matrix (nobody over target, one over with unique lowest, two over, **over target but lowest tied → continue**, lowest tied but nobody over, exactly equal to target, negative totals under `shooterSubtracts`, moon pushing three players over at once); `rebuildHands` truncation + renumbering + invalid-entry throws; edit-in-the-middle changes the winner / revives a game that had been decided; `computeResult` for in-progress / decided / early-finish with tied leader; stats over several hands including moons under both rules; empty hand list.

## Acceptance criteria
- Editing any past hand then calling `rebuildHands` + `computeHandResults` gives totals identical to replaying from scratch (add a property-style test using a small deterministic pseudo-random generator of valid hands).
- Engine stays free of React/RN imports; all new exports have tests.

## Verify
`npm run lint && npm run typecheck && npm test -- hearts`

## Handoff (fill in when done)
- Files created/changed:
- Final exported API additions (`HandResult`, `getOutcome`, `PlayerStats`, ranking shape):
- Behaviour of `computeResult` when nobody has won (early finish) and for tied leaders — what the game-over summary should use:
- Gotchas:
- Updates made to later step plans:

**Before ending:** update `hearts-step-03.md` with the real API and commit `Hearts step 2: game aggregation`.
