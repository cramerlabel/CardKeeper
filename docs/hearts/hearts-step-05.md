# Step 5 — Setup screen

Read [hearts-plan.md](./hearts-plan.md) first, then the Handoffs of steps [3](./hearts-step-03.md) and [4](./hearts-step-04.md).

## Context from previous steps
- Store: `useHeartsStore.startGame({ names, target, moonRule, firstDealer })`, `selectHasSavedGame`, `useHeartsHydrated`.
- Shared: `NameField` (`src/features/setup/NameField.tsx`), list-based name helpers with the hearts key `card-keeper/hearts/last-names`, `SegmentedControl`, `Button`, `Card`, `ScreenContainer`, engine `TARGET_OPTIONS` / `MOON_RULE_OPTIONS`.
- Reference screens: `src/app/gin/setup.tsx` and (if present) `src/app/cribbage/setup.tsx` and `src/app/spades/setup.tsx` (keyboard handling, saved-game guard, rules link, last-names prefill, random first dealer via an injectable `random` fn, pure `buildSetup` helper in `src/features/setup/*Setup.ts`). Mirror them.
- Hearts is still `available: false`; reach the screen by deep link (`cardkeeper://hearts/setup`) or direct navigation. Do **not** flip `available` here.
- `/hearts/scoreboard` does not exist until step 8: navigate with `router.replace('/hearts/scoreboard' as never)`.

## Goal
`src/app/hearts/setup.tsx`: configure and start a game.

## Tasks
1. Controls:
   - **Four name fields in seating order** ("Player 1" … "Player 4") with a hint "Enter players in seating order, clockwise" (the order drives dealer rotation and pass direction). Validate duplicates (case-insensitive); empty ⇒ "Player N".
   - **Target**: SegmentedControl `50 | 100 | 150` with caption ("Short" / "Standard" / "Long"). Default 100.
   - **Shoot the moon**: SegmentedControl `Others +26 | Shooter −26` (default Others +26) with a one-line explanation of the selected option.
   - **First dealer**: chips for the four players + "Random" (default Random; resolved at Start).
2. Pure helper `src/features/setup/heartsSetup.ts` (+ test): `resolveFirstDealer(choice, random)`, `buildSetup(raw) => { valid, errors, names, target, moonRule, firstDealer }`.
3. Saved-game guard: if a hearts game is in progress, show the same "Start a new game? This replaces the saved game" confirmation as gin.
4. Remember last names (hearts key) and prefill; best-effort, never throws.
5. Layout: portrait/landscape and keyboard-open on a 360dp-wide phone (reuse the gin approach); on tablets/landscape put the options beside the name fields. Link to rules via `openRules('hearts')`.
6. Register nothing in `_layout.tsx` yet (default slide animation is fine).

## Acceptance criteria
- Starting creates `currentGame` with correct `players`, `target`, `moonRule`, `firstDealer`, empty `hands` and navigates to the scoreboard route.
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

**Before ending:** commit `Hearts step 5: setup screen`.
