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
- DONE. Lint, typecheck and all 136 tests pass. Screenshots are in `docs/qa/` (small phone 360×640dp at 1.0× and 1.5× font, portrait + landscape; 1067×1707dp tablet portrait; splash; launcher icon).
- **What changed**
  - Branding: `scripts/generate-assets.py` (Pillow; run `python3 scripts/generate-assets.py`) generates `assets/icon.png`, `android-icon-{background,foreground,monochrome}.png`, `splash-icon.png`, `favicon.png` (felt gradient, two fanned cards, gold spade). `app.json` now configures `expo-splash-screen` (felt `#0B3D2E`, `imageWidth` 220), `expo-system-ui`, `expo-navigation-bar` (light buttons) and `android.versionCode: 1`. Installed: `expo-splash-screen ~58.0.12`, `expo-system-ui ~58.0.7`, `expo-navigation-bar ~58.0.4`. Native config changed, so `npx expo prebuild --platform android --clean` was re-run (`android/` is git-ignored).
  - Theme: `gold` `#EBC35E`, `danger` `#FF9488`, `success` `#7BE0A6` lightened and a new `borderStrong` (`#4F9C85`) for control outlines so all text is ≥ 4.5:1 and outlines ≥ 3:1 (enforced by `src/theme/contrast.test.ts`).
  - Interaction: `PressableScale` (native-driver spring press) used by `Button` and `GameCard`; `ScorePanel` pulses the score and animates the progress bar when it changes; stack transitions (`slide_from_right`, hand entry `slide_from_bottom`, game over `fade`).
  - Haptics: `src/utils/haptics.ts` (`tap`/`success`/`warning`) respects the persisted `hapticsEnabled` setting (`src/settings/`, toggle in the Home header; `accessibilityRole="switch"`). Fires on buttons, saving a hand and the game-over banner.
  - Accessibility: every control is ≥ 48dp (icon buttons, segmented control, keypad, dense buttons); buttons shrink labels to one line; Continue card stacks its buttons at font scale > 1.25; history table caps font growth at 1.2×; the LEADING pill is now a crown badge (fixes the `Alexandria` truncation); screen titles have header roles.
  - Layout: tall portrait tablets now use the stacked layout on scoreboard / hand entry / game over (side-by-side only in landscape); stacked hand entry pins the keypad + Save to the bottom; dense (landscape phone) game-over table and score panels were compacted so the final score is visible without scrolling.
  - Robustness: `src/app/_layout.tsx` exports an Expo Router `ErrorBoundary` (`ErrorFallback`: Try again / Reset saved data). **Bug fixed:** corrupt JSON or a throwing AsyncStorage used to leave zustand un-hydrated forever (blank screens); both stores now use `src/storage/safeStorage.ts` (bad reads → "nothing saved", write failures ignored). Tests cover this.
- **QA performed** (Pixel_7_API_35 only; the real `Pixel_Tablet_API_35` AVD still hasn't been booted): 360×640dp phone (`wm size 720x1280; wm density 320`) at 1.0× and 1.5× font scale; 1067×1707dp tablet (`wm size 1600x2560; wm density 240`); portrait + landscape; keyboard open on setup; rotation mid-entry kept the typed deadwood; kill/relaunch resumed the game; full game to game over (shutout). Reset with `adb shell wm size reset; adb shell wm density reset; adb shell settings put system font_scale 1.0`.
- **Remaining known issues**
  - The finished result still can't be re-opened after leaving (no history screen).
  - Not tested: the real Pixel Tablet AVD, a 7" tablet size, a physical device, TalkBack, font scale > 1.5, landscape tablet screenshots.
  - At 150% font on a 640dp-tall phone, hand entry scrolls (keypad/Save are below the fold but reachable). In dense landscape the hand-preview message can be clipped inside its scroll area.
  - The dev build shows a black screen for ~10s while Metro loads the bundle; release builds don't. The Android "stylus tutorial" popup on the tablet emulator is a system dialog (`settings put secure stylus_handwriting_enabled 0` silences it).
  - Haptics couldn't be felt on the emulator; only the on/off state and call paths were verified.
- Emulator driving tips: tap with `adb shell input tap x y` in device px (screenshots from `screencap` are downscaled when viewed: ×1.28 on the 1600×2560 tablet, ×1.2 on the 1080×2400 phone, ×1 at 720×1280). Don't run `view` on a screenshot in the same step that creates it.
- Update `step-10.md` with: final `app.json` values (name, package, version), assets paths. (Done.)
