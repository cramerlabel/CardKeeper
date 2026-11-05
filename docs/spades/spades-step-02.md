# Step 2 — Engine: game aggregation (bags, totals, winner, stats)

Read [spades-plan.md](./spades-plan.md) first, then the Handoff of [step 1](./spades-step-01.md).

## Context from previous steps
- `src/games/spades/engine/{types,config,teams,scoring,index}.ts` exist with `validateHand`, `scoreHand`, `getConfig`, team/dealer helpers (see step 1 Handoff for the real API and `ERROR_*` constants).
- Reference for rebuild/aggregate patterns: `src/games/cribbage/engine/{game,scoring}.ts` (`rebuildEvents` throws `InvalidScoreError` on an invalid entry and truncates after the winning event; `computeResult`), and the gin engine.

## Goal
Add everything that depends on the sequence of hands: bag carry-over and penalties, running totals, game-over detection, the result summary, and hand rebuilding for edits.

## Tasks
1. `game.ts`:
   - `InvalidHandError` (with `errors: string[]`), `createHandRecord(id, number, input, config)` (throws on `validateHand` errors).
   - `rebuildHands(entries: { id, input }[], ctx)`: recompute in order, renumber from 1, **stop after the hand that decides the game**, throw `InvalidHandError` on an invalid entry (the store must catch it).
2. `scoring.ts` additions:
   - `computeHandResults(hands, ctx): HandResult[]` — per hand: `{ number, dealer, teams: [TeamHandScore & { bagPenalty: number, bagsAfter: number, pointsWithPenalty: number, totalAfter: number }, …] }`. Bag carry: `bags = prev + bagsAdded`; `while (bags >= bagLimit) { bags -= bagLimit; penalty += bagPenalty }`.
   - `computeTotals`, `computeBags` (derive from `computeHandResults`; return `[0, 0]` for no hands).
   - `getOutcome(totals, config)` (pure; used by `isGameOver`, `computeResult`, `rebuildHands`) implementing the overview game-end rules: target / floor / both over (higher wins) / exact tie (no winner, continue) / target-vs-floor.
   - `isGameOver(hands, ctx)`.
   - `computeResult(hands, ctx)` → `{ winner, reason, totals, bags, margin (winner − loser, 0 when no winner), handsPlayed, nil: NilStats[4], bagPenalties: [n, n] }`; `NilStats = { attempted, made, blindAttempted, blindMade }` per player; `winner` is `null` when no hand has decided the game (callers decide how to present an early finish).
3. `index.ts`: re-export the full public API.
4. Tests: bag accumulation and penalty at exactly 10, at 9→10, a single hand crossing 10 twice (e.g. 9 bags carried, then a hand where both partners bid nil and take 13 tricks between them = 13 bags → 22 → two penalties, 2 bags left), penalty reducing a score below the floor, running totals over several hands, dealer rotation in `HandResult`, `getOutcome` matrix (each overview rule incl. exact tie and both ≥ target), `rebuildHands` truncation + renumbering + invalid entry throws, edit-in-the-middle changes later bag penalties and winner, `computeResult` for in-progress / target win / floor loss / early-finish, nil stats for several hands, empty hand list.

## Acceptance criteria
- Editing any past hand and calling `rebuildHands` + `computeHandResults` gives totals and bag penalties identical to replaying from scratch (add a property-style test with a small deterministic generator of random valid hands).
- Engine stays free of React/RN imports; all new exports have tests.

## Verify
`npm run lint && npm run typecheck && npm test -- spades`

## Handoff (fill in when done)
- Files created/changed:
- Final exported API additions (`HandResult` shape, `getOutcome`, `NilStats`):
- Behaviour of `computeResult` when nobody has won (early finish) — what the game-over summary should use:
- Gotchas:
- Updates made to later step plans:

**Before ending:** update `spades-step-03.md` with the real API and commit `Spades step 2: game aggregation`.
