# Step 5 — Setup screen

Read [spades-plan.md](./spades-plan.md) first, then the Handoffs of steps [3](./spades-step-03.md) and [4](./spades-step-04.md).

## Context from previous steps
- Store: `useSpadesStore.startGame({ names, target, blindNil, firstDealer })`, `selectHasSavedGame`, `useSpadesHydrated`.
- Shared: `NameField` (`src/features/setup/NameField.tsx`), list-based name helpers with the spades key `card-keeper/spades/last-names`, `teamLabel`, `SegmentedControl`, `Button`, `Card`, `ScreenContainer`, engine `TARGET_OPTIONS`.
- Reference screens: `src/app/gin/setup.tsx` and (if present) `src/app/cribbage/setup.tsx` (keyboard handling, saved-game guard, rules link, last-names prefill, random first dealer via an injectable `random` fn, pure `buildSetup` helper in `src/features/setup/*Setup.ts`). Mirror them.
- Spades is still `available: false`; reach the screen by deep link (`cardkeeper://spades/setup`) or direct navigation. Do **not** flip `available` here.
- `/spades/scoreboard` does not exist until step 8: navigate with `router.replace('/spades/scoreboard' as never)`.

## Goal
`src/app/spades/setup.tsx`: configure and start a game.

## Tasks
1. Controls:
   - **Four name fields in seating order** with a clear partnership indication (e.g. "Player 1 · Team A", "Player 2 · Team B", "Player 3 · Team A", "Player 4 · Team B") and a short hint "Partners sit across from each other". Validate duplicates (case-insensitive); empty => "Player N".
   - **Target**: SegmentedControl `500 | 300 | 200` with a caption showing the loss floor (−200 / −150 / −100). Default 500.
   - **Blind Nil**: switch/segmented `On | Off` (default On) with a one-line explanation (±200).
   - **First dealer**: chips for the four players + "Random" (default Random; resolved at Start).
2. Pure helper `src/features/setup/spadesSetup.ts` (+ test): `resolveFirstDealer(choice, random)`, `buildSetup(raw) => { valid, errors, names, target, blindNil, firstDealer }`.
3. Saved-game guard: if a spades game is in progress, show the same "Start a new game? This replaces the saved game" confirmation as gin.
4. Remember last names (spades key) and prefill; best-effort, never throws.
5. Layout: portrait/landscape and keyboard-open on a 360dp-wide phone (reuse the gin approach); on tablets lay the two teams out side by side (team A card / team B card) so partnerships are obvious. Link to rules via `openRules('spades')`.
6. Register nothing in `_layout.tsx` yet (default slide animation is fine).

## Acceptance criteria
- Starting creates `currentGame` with correct `players`, `target`, `blindNil`, `firstDealer`, empty `hands` and navigates to the scoreboard route.
- Invalid names block Start with inline errors; changing options preserves typed names.
- Screenshot/manual check at 360dp wide with the keyboard open and font scale 1.3.

## Verify
`npm run lint && npm run typecheck && npm test`; manual run on emulator/device.

## Handoff (fill in when done)
- Files created:
- Setup helper signatures:
- How you reached the screen for testing:
- Gotchas:
- Updates made to later step plans:

**Before ending:** commit `Spades step 5: setup screen`.
