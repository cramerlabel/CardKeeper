# Step 9 — Polish and QA

## Context
See `step-0.md`. All screens exist (Steps 4–8):
- `/` Home (game grid + Continue card), `/gin/setup`, `/gin/scoreboard`, `/gin/hand` (add/edit, `?handId=`), `/gin/game-over`. All use `ScreenContainer`, the felt theme, `useResponsive` (`sizeClass`, `isLandscape`, `isDense`) and the short-side `useTextScale` from `src/features/scoreboard/`.
- Reusable components: `Button`, `Card`, `SegmentedControl`, `ScreenContainer`, `GameMenu`, `Keypad`.
- Known rough edges / TODOs: tall tablets leave empty space below the hand-entry form and scoreboard history card; the scoreboard `Alexandria` name truncates next to the LEADING badge on narrow phones; the finished result can't be re-opened after leaving (only stored in `history`, no history screen); haptics are not mute-able; no error boundary; the real `Pixel_Tablet_API_35` AVD has never been booted (tablet checks used `adb shell wm size 1600x2560` + `wm density 240`; reset with `wm size reset; wm density reset`); the dense-landscape threshold (`height < 480`) was only exercised on the Pixel 7.
- Emulator workflow notes: Metro `npx expo start --dev-client --port 8081` + `adb reverse tcp:8081 tcp:8081`; the first bundle after Metro starts can take a while, so warm it with `curl "localhost:8081/node_modules/expo-router/entry.bundle?platform=android&dev=true"` before launching, otherwise the app shows "Unable to load script". Screenshots are 1.2× the device's tap coordinates on the Pixel 7 (screencap 900px wide vs 1080px).

## Goal
Professional look and feel, accessibility and responsive verification.

## Tasks
1. App icon (adaptive icon, foreground/background/monochrome) and splash screen; consistent branding. Generate assets (e.g. via script producing PNGs) and set in `app.json`.
2. Visual pass: spacing, typography scale, consistent buttons/cards/shadows, status bar and navigation bar colors, screen transitions, press animations, subtle score-change animation.
3. Haptics on key actions (save hand, game over) with a mute-able setting if time allows.
4. Accessibility: labels/roles, contrast ≥ 4.5:1, dynamic font scale sanity (system font size at 130–150% shouldn't break layouts), minimum 48dp targets.
5. QA matrix on emulators: small phone (~360×640), standard phone, 7" tablet, 10"+ tablet; portrait + landscape; keyboard open on setup/entry; rotation mid-entry doesn't lose input.
6. Error boundaries; handle corrupted saved state.
7. Run lint, typecheck, tests; fix anything outstanding.

## Acceptance criteria
- No layout breakage across the QA matrix; screenshots captured (optional, in `docs/`).
- Lint/typecheck/tests pass.

## Handoff notes (fill in when done)
- Remaining known issues: _TBD_
- Update `step-10.md` with: final `app.json` values (name, package, version), assets paths.
