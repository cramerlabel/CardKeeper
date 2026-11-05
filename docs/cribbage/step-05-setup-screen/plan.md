# Step 5 — Setup screen

Read [../plan.md](../plan.md) first, then the Handoffs of steps [2](../step-02-store/plan.md) and [4](../step-04-rules-and-shared-ui/plan.md).

## Context from previous steps
- Store: `useCribbageStore.startGame({ names, target, firstDealer })`, `selectHasSavedGame`, `useCribbageHydrated`.
- Shared (step 4, real API): `NameField` (`src/features/setup/NameField.tsx`, props `{ label, value, placeholder, error, onChangeText, inputRef?, returnKeyType?, onSubmitEditing? }`); from `@/features/setup/playerNames`: `validateNameList(raw) => { valid, errors, names }`, `loadLastNameList(AsyncStorage, CRIBBAGE_NAMES_STORAGE_KEY)`, `saveLastNameList(names, AsyncStorage, CRIBBAGE_NAMES_STORAGE_KEY)`, `defaultName(index)`, `MAX_NAME_LENGTH`; `SegmentedControl`, `Button`, `Card`, `ScreenContainer`.
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

## Handoff
- Files created: `src/app/cribbage/setup.tsx`, `src/features/setup/cribbageSetup.ts` (+ `cribbageSetup.test.ts`), `src/features/setup/DealerChips.tsx`, `src/features/setup/cribbageSetupScreen.test.tsx` (screen-level test: render with mocked `expo-router`/AsyncStorage, real store).
- Setup helper signatures (`@/features/setup/cribbageSetup`): `type FirstDealerChoice = PlayerIndex | 'random'`; `type CribbageTarget = 121 | 61`; `type RandomFn = () => number`; `resolveFirstDealer(choice, playerCount, random = Math.random): PlayerIndex` (a stale/out-of-range index redraws); `normalizeDealerChoice(choice, playerCount): FirstDealerChoice` (falls back to `'random'`); `buildSetup({ names: readonly string[], target, dealer }, random = Math.random) => { valid, errors: (string | null)[], names: string[], target, firstDealer }` (player count = `names.length`, invalid outside 2–3; `random` is only called for a `'random'` dealer); `describeGameLength(target): string` (skunk lines read from engine config).
- How you reached the screen for testing: debug build on the Pixel 7 emulator (`npx expo run:android`, then `npx expo start`), deep link `adb shell am start -a android.intent.action.VIEW -d "cardkeeper://cribbage/setup" com.steve.cardkeeper`. Checked at 360dp (`wm density 480`) with font scale 1.3: keyboard open, duplicate-name error, 2↔3 players, dealer chips, 61 game, Start (persisted `currentGame` verified in AsyncStorage), saved-game alert, landscape two-column layout, prefill of last names. After Start the app shows "Unmatched Route" because `/cribbage/board` is built in step 8.
- Gotchas:
  - The release APK already on a device has a different signature than the debug build: uninstall it before `expo run:android` can install.
  - The screen keeps text for all 3 name fields and only renders the first N, so switching 2↔3 keeps typed text; a chosen dealer who no longer exists (Player 3 → 2 players) resets to Random.
  - `buildSetup` is called when Start is pressed (after the saved-game confirmation), not on render, so Random is drawn at start; render-time validation uses `validateNameList`.
  - Last names are saved as typed-and-trimmed (blank stays blank, so the prefill shows placeholders); the saved list length also restores the player count. Prefill is skipped once the user touches anything.
  - Landscape with width >= 600dp shows Players and Game cards side by side; narrower layouts scroll in one column inside `KeyboardAvoidingView` (same as gin).
- Updates made to later step plans: step 8 notes that setup `router.replace`s to `/cribbage/board` with a fresh game (`deal = 1`, no events), so the board must handle an empty game.

**Before ending:** commit `Cribbage step 5: setup screen`.
