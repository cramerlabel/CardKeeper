# Step 4 — Game selection screen

## Context
See `step-0.md`. Registry and store from Step 3:
- Registry: `import { games } from '@/games/registry'`; each `GameDefinition` has `id, name, description, route, icon, playerCount (number | [min,max]), available`. Render `!available` as "Coming soon".
- Saved game: `import { useGinStore, useGinHydrated, selectHasSavedGame, selectTotals } from '@/games/ginRummy/store'`. Wait for `useGinHydrated()` to be true, then `useGinStore(selectHasSavedGame)` is true when an in-progress game exists; read `useGinStore(s => s.currentGame)` (players, hands) and `useGinStore(selectTotals)` for the banner. Discard = `useGinStore.getState().abandonGame()`. Theme and `useResponsive` / `ScreenContainer` from Step 1.

## Goal
The app's home screen: pick a game type.

## Tasks
1. Home/menu screen: app title/logo header, grid of game cards from the registry. Grid columns by size class: compact = 1–2, medium = 2–3, expanded = 3–4. Cards show icon, name, short description, player count.
2. Available game → navigates to Gin Rummy flow. Unavailable → dimmed with a "Coming soon" badge, not tappable (or shows a small toast).
3. If a saved in-progress Gin Rummy game exists, show a "Continue game" banner/card (players + score) with Continue and Discard actions (confirm before discard).
4. Press feedback (scale/opacity), accessibility labels, large touch targets (≥48dp).
5. Looks right in portrait and landscape from ~360dp phone to ~1200dp tablet; check on emulators.
6. Wire navigation (router) with routes stubbed for Step 5 (`/gin/setup`) and later steps.

## Acceptance criteria
- Menu renders from the registry; adding a registry entry adds a card with no screen changes.
- Responsive grid verified on phone + tablet emulators, both orientations.
- Continue banner appears only when a saved game exists.

## Handoff notes (fill in when done)
- DONE. Verified on the Pixel 7 phone AVD (portrait + landscape) and Pixel Tablet AVD (portrait + landscape): grid, Continue banner (seeded game), confirm-discard dialog, Gin Rummy navigation, and non-tappable dimmed "Coming soon" cards.
- Routes (expo-router, `src/app/`): `/` home (`index.tsx`); `/gin/setup` (stub, Step 5, `gin/setup.tsx`); `/gin/scoreboard` (stub, Step 6, `gin/scoreboard.tsx`). Registry Gin Rummy `route` is now `/gin/setup`. Navigation uses `router.push(route as never)` (typed routes are not enabled).
- Home components in `src/features/home/`: `GameCard` (Pressable + `Card`, scale/opacity press feedback, haptics, a11y label, "Coming soon" badge, dimmed + disabled when `!available`), `GameGrid` (equal-flex rows via `chunk`, no width measuring), `ContinueGameCard` (players, totals, hands played, Continue + Discard with `Alert.alert` confirm), `grid.ts` (`getGridColumns(sizeClass, isLandscape, contentWidth)`, `chunk`; columns follow compact 1–2 / medium 2–3 / expanded 3–4 but are reduced so cards stay ≥220dp wide). `src/games/playerCount.ts` has `formatPlayerCount`.
- Continue banner: shown when `useGinHydrated() && selectHasSavedGame && currentGame`. Continue → `/gin/scoreboard`; Discard → `useGinStore.getState().abandonGame()` after confirm.
- Gotcha: Android draws a rectangular shadow behind translucent (opacity < 1) elevated views; unavailable cards zero out `elevation`/`shadowOpacity`.
- Gotcha: the dev build only works via the installed `com.steve.cardkeeper` app (launch with `adb shell monkey -p com.steve.cardkeeper -c android.intent.category.LAUNCHER 1` after `adb reverse tcp:8081 tcp:8081`); Expo Go can't load it (no native AsyncStorage).
- Updated `step-5.md` with navigation paths and reusable components.
