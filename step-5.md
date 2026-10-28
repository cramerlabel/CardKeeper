# Step 5 — New game setup (player names)

## Context
See `step-0.md`. Store `startGame(names)` from Step 3.

From Step 4:
- Home (`/`) opens this flow via the registry route `/gin/setup`. A stub already exists at `src/app/gin/setup.tsx` — replace its body (keep the path). Stub scoreboard (Step 6) is `src/app/gin/scoreboard.tsx`; navigate there after `startGame` with `router.replace('/gin/scoreboard' as never)` (typed routes are off).
- Home's "Continue game" card already handles resuming/discarding a saved game; setup only needs the "replace saved game?" confirm (task 6) using `selectHasSavedGame` + `Alert.alert` (see `src/features/home/ContinueGameCard.tsx` for the pattern).
- Reuse: `ScreenContainer` (pass `scroll` for keyboard), `Card`, `Button` from `src/components`; theme tokens from `@/theme`; `useResponsive()` for max width/size class. Stub screens show the centered layout pattern.

## Goal
Screen to enter Player 1 and Player 2 names and start a Gin Rummy game.

## Tasks
1. Setup screen: two name inputs (labels "Player 1", "Player 2"), max length (~20), trimmed; defaults/placeholders "Player 1"/"Player 2" if left empty is allowed (decide: recommended allow default names).
2. Validation: names must differ (case-insensitive) — inline error; Start button disabled until valid.
3. Keyboard handling (KeyboardAvoidingView / scroll), `returnKeyType` next/done, works in landscape and on tablets (centered card with max width).
4. Remember last-used names (prefill) — store in AsyncStorage via the store or a small settings slice.
5. Start → calls `startGame`, navigates to the scoreboard route (Step 6; stub screen ok).
6. If a saved game exists and user starts a new one, confirm that it will replace it.

## Acceptance criteria
- Can start a game with valid names; invalid input is blocked with clear messages.
- Layout good on small phone with keyboard open and on tablets in both orientations.

## Handoff notes (fill in when done)
- Route: `/gin/setup` (`src/app/gin/setup.tsx`). On Start it calls `startGame(names)`, saves the names, then `router.replace('/gin/scoreboard' as never)`.
- Name logic (pure, tested): `src/features/setup/playerNames.ts` — `validateNames`, `effectiveName`, `MAX_NAME_LENGTH` (20), `loadLastNames`/`saveLastNames`. Empty names default to "Player 1"/"Player 2"; names must differ case-insensitively (after defaults).
- Last-used names persist in AsyncStorage under `card-keeper/gin-rummy/last-names` (separate from the game store, so `clear()` doesn't wipe them).
- Replace-saved-game confirm uses `selectHasSavedGame` + `Alert.alert` at press time.
- `ScreenContainer` scroll mode now sets `keyboardShouldPersistTaps="handled"`; setup wraps it in a `KeyboardAvoidingView` (`behavior="padding"`).
- Not yet verified on a device/emulator (only typecheck, lint, unit tests).
- `step-6.md` updated with scoreboard route and selectors.
