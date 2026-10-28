# Step 1 — Project scaffold

## Context
See `step-0.md` for the project overview, rules and decisions. Step 0 installed the Android toolchain; its handoff notes list versions and paths.

**Toolchain (from Step 0):** Intel x86_64 Mac, macOS 26.7.1, Node 24.15.0. JDK Temurin 17.0.20.1 (`JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home`). `ANDROID_HOME=~/Library/Android/sdk` (also `ANDROID_SDK_ROOT`), set in `~/.zshrc`, so non-interactive shells may need `source ~/.zshrc` or `zsh -i -c`. Installed: platform-tools 37.0.1, platforms android-35 and android-36, build-tools 35.0.0 and 36.0.0, emulator 37.2.12, licenses accepted, no NDK. AVDs: `Pixel_7_API_35` (phone), `Pixel_Tablet_API_35` (tablet), both x86_64 (`emulator -avd <name>`). Latest `expo` on npm was 58.0.19; if the chosen SDK needs a different platform/build-tools, run `sdkmanager "platforms;android-NN" "build-tools;NN.0.0"`. Gotcha: `brew install` of formulae can compile from source on this Homebrew (Tier 3) and take very long; prefer casks/prebuilt binaries.

## Goal
A running Expo + TypeScript app skeleton with folder structure, tooling, theming and a responsive layout helper. No game logic yet.

## Tasks
1. `git init` in `/Users/steve/Projects/Cards` (keep `step-*.md` files; add `.gitignore` for node_modules, android/ios build output, .expo).
2. Scaffold Expo TS app in place: `npx create-expo-app@latest . --template blank-typescript` (or the current equivalent; if the folder is non-empty, scaffold into a temp dir and move). Use the latest stable SDK; record the SDK version.
3. Install: `expo-router` (or `@react-navigation/native` + native-stack — pick one and record it), `react-native-safe-area-context`, `react-native-screens`, `zustand`, `@react-native-async-storage/async-storage`, `expo-haptics`, `@expo/vector-icons`, `react-native-reanimated` (only if needed).
4. Dev tooling: ESLint + Prettier (Expo config), Jest with `jest-expo`, `npm test` script, `npm run typecheck`.
5. Suggested structure:
   ```
   src/
     app/ (or screens/)        # routes/screens
     components/               # shared UI (Button, Card, ScreenContainer, NumberInput…)
     games/
       registry.ts             # list of GameDefinition
       types.ts                # GameDefinition interface
       ginRummy/               # engine, store, screens, components
     theme/                    # colors, typography, spacing, dark/light tokens
     hooks/useResponsive.ts    # size class + scale helpers
     storage/
   ```
6. Theme: a professional card-table palette (deep green/felt + warm accents, high-contrast text), typography scale, spacing scale, radius, shadows. Support system light/dark if cheap; otherwise single dark "felt" theme.
7. `useResponsive()` hook: based on `useWindowDimensions`; returns `sizeClass` (`compact` <600dp, `medium` 600–840dp, `expanded` >840dp), `isLandscape`, `scale(n)`, and a `maxContentWidth`. A `ScreenContainer` component centers content with max width and handles safe-area.
8. `app.json`: name (e.g. "Card Keeper"), slug, `android.package` (e.g. `com.steve.cardkeeper`), `orientation: "default"` (allow rotation), `userInterfaceStyle`.
9. Placeholder home screen proving theme + responsive hook work; add a unit test for the hook's size-class logic (pure function).
10. Run the app on an emulator or device (`npx expo run:android`, which also validates the Step 0 toolchain).

## Acceptance criteria
- `npm run typecheck`, `npm test`, lint all pass.
- App launches on an Android emulator/device and rotates correctly.
- Structure above exists; the choices (router, SDK version, package id) are recorded below.

## Handoff notes (fill in when done)
- DONE. Expo SDK **58** (`expo ~58.0.20`), React Native **0.88.0**, React 19.3.0, TypeScript 6.0.3. Router: **expo-router** (routes in `src/app/`, entry `expo-router/entry`). Android package / iOS bundle id: `com.steve.cardkeeper`; app name "Card Keeper"; scheme `cardkeeper`; `orientation: "default"`; `userInterfaceStyle: "dark"`.
- Installed: zustand, @react-native-async-storage/async-storage, expo-haptics, @expo/vector-icons, expo-font, expo-linking, expo-constants, react-native-safe-area-context, react-native-screens. **reanimated NOT installed** (add with `npx expo install react-native-reanimated react-native-worklets` if needed). `react-dom@19.3.0` is pinned (needed to resolve peer deps with npm). Dev: jest, jest-expo, @types/jest, react-test-renderer, eslint (flat config, eslint-config-expo), prettier.
- Scripts: `npm test`, `npm run typecheck`, `npm run lint`, `npm run format`, `npm run android` (= `expo run:android`). `npx expo-doctor` passes 20/20.
- Theme (`src/theme`, import from `@/theme`): single dark "felt" theme. Exports `colors` (felt, feltDark, feltLight, surface, surfaceRaised, border, gold, goldDark, cream, textPrimary, textSecondary, textOnAccent, danger, success, cardRed, cardBlack, overlay), `typography` (display, title, heading, body, bodyStrong, caption, label), `spacing` (xxs..xxxl = 2,4,8,12,16,24,32,48), `radius` (sm, md, lg, xl, pill), `shadows` (none, card, raised), and `theme` aggregating all.
- `useResponsive()` (`src/hooks/useResponsive.ts`) returns `{ width, height, sizeClass: 'compact'|'medium'|'expanded', isLandscape, scale(n), maxContentWidth }`. Pure helpers `getSizeClass`, `getScaleFactor`, `getMaxContentWidth` are unit-tested (`useResponsive.test.ts`). Breakpoints: compact <600, medium 600–840 (inclusive), expanded >840. `scale` is relative to a 360dp base, clamped 0.85–1.5. Max content width 600/720/960.
- Shared components in `src/components`: `ScreenContainer` (felt bg, safe area, centered max width, optional `scroll`), `Card`, `Button` (primary/secondary, haptics). `src/games/types.ts` (`GameDefinition`) and `src/games/registry.ts` (`games`, `getGame`) exist; Gin Rummy is registered with route `/gin-rummy` (no route yet; home shows a disabled "Coming soon" button). Empty `src/storage/` and `src/games/ginRummy/engine/` (with `.gitkeep`).
- Verified: `expo run:android` built and ran on `Pixel_7_API_35`; portrait and landscape both render correctly. First Gradle build took ~14 min (Gradle auto-installed NDK/CMake into the SDK). Gotchas: `expo run:android` with `CI=1` starts Metro with reloads disabled; use `npx expo start --dev-client` for dev and relaunch the app with `adb reverse tcp:8081 tcp:8081`. `android/` is generated (git-ignored). Emulator boot ~3 min. A git repo was initialised but nothing is committed yet. `AGENTS.md` came from the Expo template (says to use `npx expo install` for packages).
- `step-2.md` updated with TS config, test runner and engine path.
