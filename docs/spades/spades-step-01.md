# Step 1 — Engine foundations: types, config, validation, single-hand scoring

Read [spades-plan.md](./spades-plan.md) first (decisions, rules, contracts, session protocol).

## Context from previous steps
None. Reference implementations to mirror: `src/games/ginRummy/engine/*` and `src/games/cribbage/engine/*` (types/config/scoring/game/index + tests; read the cribbage step 1 Handoff in `docs/cribbage/step-01-engine/plan.md` for conventions such as exported `ERROR_*` message constants). Note: the cribbage dir may not exist yet if that work is not merged; the gin engine is sufficient.

## Goal
Create the pure, fully tested building blocks of the Spades engine under `src/games/spades/engine/`: types, config, validation and the scoring of **one hand** (no cross-hand state yet — that is step 2).

## Tasks
1. `types.ts`: types from the overview contract (`PlayerIndex`, `TeamIndex`, `BidKind`, `PlayerHand`, `HandInput`, `SpadesConfig`, `TeamHandScore`, `HandRecord`, `InvalidHandError` may live in `game.ts` like cribbage).
2. `config.ts`: `getConfig(target: 500 | 300 | 200, blindNil: boolean)` with floors −200 / −150 / −100; constants `TRICKS_PER_HAND = 13`, `MAX_BID = 13`, `PLAYER_COUNT = 4`; `TARGET_OPTIONS` (value + label + floor caption) for the setup UI; `BID_KIND_LABELS`.
3. `teams.ts`: `teamOf`, `partnerOf`, `teamPlayers`, `dealerOf(handNumber, firstDealer)`, `nextPlayer` helpers (pure, tested).
4. `validateHand(input, config)`: collect **all** errors, exported as `ERROR_*` constants: exactly 4 entries; `kind` valid; `bid` an integer 1–13 when `kind === 'bid'` and exactly 0 for nil kinds; `blindNil` rejected when `config.blindNilEnabled` is false; `tricks` an integer 0–13; the four `tricks` sum to 13 (error message should say the current sum).
5. `scoring.ts` → `scoreHand(input, config)`: returns `[TeamHandScore, TeamHandScore]` implementing the overview rules (contract bid/tricks from non-nil players only; made/missed; bags = overtricks + nil bidders' tricks when `nilTricksCountAsBags`; nil/blind nil made/failed points; both-nil team has no contract; `points = bidPoints + bagPoints + nilPoints`). Does **not** apply the 10-bag penalty.
6. `index.ts` barrel (only what exists so far; step 2 extends it).
7. Tests (`*.test.ts`) — table-driven: validation matrix (each error alone and combined, sum 12/14, blind nil disabled); every scoring case: made exactly, made with bags, missed, bid 1 and bid 13, nil made/failed, blind nil made/failed, nil + partner bid (partner makes / misses / nil tricks become bags), both nil (both made, one failed, both failed), nil bidder takes tricks while partner makes bid exactly, team with 0 tricks total, config changes (bag point, `nilTricksCountAsBags: false`), team/partner/dealer helpers for all 4 players and wrap-around.

## Acceptance criteria
- Engine has no React/RN imports and is deterministic.
- Every exported function and every validation error is covered by tests.
- Scoring worked examples in the tests match the overview rules and are written as readable comments/test names so step 4 (rules page) can cross-check them.

## Verify
`npm run lint && npm run typecheck && npm test -- spades`

## Handoff (fill in when done)
- Files created:
- Final exported API (note any deviations from the overview contract):
- Validation error constants:
- Scoring decisions/ambiguities resolved (esp. nil tricks as bags, both-nil teams):
- Gotchas:
- Updates made to later step plans:

**Before ending:** update `spades-step-02.md` ("Context from previous steps") with the real API and commit `Spades step 1: engine foundations`.
