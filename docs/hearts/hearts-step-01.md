# Step 1 — Engine foundations: types, config, validation, single-hand scoring

Read [hearts-plan.md](./hearts-plan.md) first (decisions, rules, contracts, session protocol).

## Context from previous steps
None. Reference implementations to mirror: `src/games/ginRummy/engine/*` and `src/games/cribbage/engine/*` (types/config/scoring/game/index + tests; read the cribbage step 1 Handoff in `docs/cribbage/step-01-engine/plan.md` for conventions such as exported `ERROR_*` message constants). If Spades step 1 has landed (`src/games/spades/engine/*`, `docs/spades/spades-step-01.md` Handoff) copy its file layout and conventions exactly — Hearts is the same shape without teams.

## Goal
Create the pure, fully tested building blocks of the Hearts engine under `src/games/hearts/engine/`: types, config, validation and the scoring of **one hand** (no cross-hand state yet — that is step 2).

## Tasks
1. `types.ts`: `PlayerIndex`, `MoonRule`, `PassDirection`, `HandInput`, `HeartsConfig`, `HandScore`, `HandRecord`, `GameContext` per the overview contract (`InvalidHandError` may live in `game.ts` in step 2 like cribbage/spades).
2. `config.ts`: constants `PLAYER_COUNT = 4`, `HEARTS_PER_HAND = 13`, `QUEEN_POINTS = 13`, `HAND_POINTS = 26`; `getConfig(target: 50 | 100 | 150, moonRule)`; `DEFAULT_TARGET = 100`, `DEFAULT_MOON_RULE = 'othersAdd'`; `TARGET_OPTIONS` (value + label, e.g. "100 · Standard") and `MOON_RULE_OPTIONS` (value + short label "Others +26" / "Shooter −26" + one-line caption) for the setup UI; `PASS_LABELS` ("Pass left", "Pass right", "Pass across", "No pass").
3. `players.ts`: `dealerOf(handNumber, firstDealer)`, `nextPlayer(p)`, `passDirectionOf(handNumber)` (hand 1 left, 2 right, 3 across, 4 hold, repeating). Pure + tested, including wrap-around and hand numbers ≥ 5.
4. `validateHand(input, config)`: collect **all** errors, exported as `ERROR_*` constants: exactly 4 `hearts` entries; each an integer 0–13; the four values sum to 13 (message states the current sum, e.g. "Hearts must add up to 13 — currently 11"); `queen` is an integer 0–3.
5. `scoring.ts` → `scoreHand(input, config)`: returns `{ raw, points, shooter }` implementing the overview rules (raw points, moon detection requires **13 hearts and the queen on the same player**, both `moonRule` variants). Also export `isMoon(input): PlayerIndex | null` if useful.
6. `index.ts` barrel (only what exists so far; step 2 extends it).
7. Tests (`*.test.ts`) — table-driven: validation matrix (each error alone and combined; sum 12/14; negative, fractional, 14 hearts; queen out of range); scoring cases: normal hand (e.g. hearts 5/4/3/1, queen on player 2), queen taker with 0 hearts, a player with all 13 hearts but **not** the queen (not a moon: 13 points to them, 13 to the queen holder), full moon under both rules, queen holder takes 12 hearts (not a moon), hand total always 26 for non-moon; dealer/pass helpers for hands 1–9.

## Acceptance criteria
- Engine has no React/RN imports and is deterministic.
- Every exported function and every validation error is covered by tests.
- Scoring worked examples in the tests are readable (test names/comments) so step 4 (rules page) can cross-check them.

## Verify
`npm run lint && npm run typecheck && npm test -- hearts`

## Handoff (fill in when done)
- Files created:
- Final exported API (note any deviations from the overview contract):
- Validation error constants:
- Scoring decisions/ambiguities resolved (esp. moon detection, negative points):
- Gotchas:
- Updates made to later step plans:

**Before ending:** update `hearts-step-02.md` ("Context from previous steps") with the real API and commit `Hearts step 1: engine foundations`.
