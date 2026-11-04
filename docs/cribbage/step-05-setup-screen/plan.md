# Step 5 — Setup screen

Read [../plan.md](../plan.md) first, then the Handoffs of steps [2](../step-02-store/plan.md) and [4](../step-04-rules-and-shared-ui/plan.md).

## Context from previous steps
- Store: `useCribbageStore.startGame({ names, target, firstDealer })`, `selectHasSavedGame`, `useCribbageHydrated`.
- Shared: `NameField` (`src/features/setup/NameField.tsx`), list-based name helpers with the cribbage storage key, `SegmentedControl`, `Button`, `Card`, `ScreenContainer`.
- Reference screen: `src/app/gin/setup.tsx` (keyboard handling, saved-game guard, rules link, last-names prefill).
- Cribbage is still `available: false` in the registry, so this route is not reachable from the home grid yet; test by navigating directly (`npx expo start` + deep link `cardkeeper://cribbage/setup`, or temporarily via URL in dev). Do **not** flip `available` here.
- `/cribbage/board` does not exist until step 8; navigate with `router.replace('/cribbage/board' as never)`.
- Real store API (step 2): `startGame({ names: readonly string[] (2–3), target: 121 | 61, firstDealer: PlayerIndex })` returns `ActionResult` (fails on bad player count/target/dealer; blank names become "Player N"); it replaces any current game. Types `StartGameOptions`, `ActionResult` are exported from `@/games/cribbage/store`.

## Goal
`src/app/cribbage/setup.tsx`: configure and start a game.

## Tasks
1. Controls:
   - Players: SegmentedControl `2 players | 3 players`.
   - Name fields (2 or 3, mount/unmount cleanly when the count changes; keep typed text), validated for duplicates (case-insensitive) using the list helpers; empty => "Player N".
   - Game length: SegmentedControl `121 (standard) | 61 (short)` with caption explaining the skunk line for each.
   - First dealer: chips for each player + a "Random" option (default Random; resolve randomness when pressing Start, via an injectable `random` fn so the pure helper is testable).
2. Pure helper `src/features/setup/cribbageSetup.ts` (+ test): `resolveFirstDealer(choice, playerCount, random)`, `buildSetup(raw) => { valid, errors, names, target, firstDealer }`.
3. Saved-game guard: if a cribbage game is in progress show the same "Start a new game? This replaces the saved game" confirmation pattern as gin setup.
4. Remember last names (cribbage key) and prefill; best-effort, never throws.
5. Layout: works portrait/landscape and with the keyboard open on small phones (reuse the gin approach: `KeyboardAvoidingView`/scroll). Link to rules via `openRules('cribbage')`.
6. Register nothing in `_layout.tsx` yet (default slide animation is fine).

## Acceptance criteria
- Starting a game creates `currentGame` with correct `players`, `target`, `firstDealer`, `deal = 1` and navigates to `/cribbage/board`.
- Invalid names block Start with inline errors; 2↔3 switching preserves text.
- Screenshot/manual check at 360dp wide with keyboard open and font scale 1.3.

## Verify
`npm run lint && npm run typecheck && npm test`; manual run on emulator/device.

## Handoff (fill in when done)
- Files created:
- Setup helper signatures:
- How you reached the screen for testing:
- Gotchas:
- Updates made to later step plans:

**Before ending:** commit `Cribbage step 5: setup screen`.
