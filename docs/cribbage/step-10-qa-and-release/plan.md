# Step 10 — QA, polish, docs, release build

Read [../plan.md](../plan.md) first, then the Handoffs of **all** earlier steps (collect their "Known issues").

## Context from previous steps
- Cribbage is fully playable (setup, board, score entry, game-over). Existing QA conventions: screenshots in `docs/qa/` (phone/small/tablet, portrait/landscape, font scale 1.5), release process in `README.md` ("Building the release APK", "Bumping the version"), earlier step docs `step-9.md`/`step-10.md` at the repo root for the Android toolchain (JDK 17, `ANDROID_HOME`, emulator `emulator-5554`).
- `react-native-svg` is a native module: the Android project must be regenerated (`npx expo prebuild --platform android --clean`) before the release build.

## Goal
Verify everything end to end, fix defects found, and produce a release APK.

## Tasks
1. Automated: `npm run lint`, `npm run typecheck`, `npm test` (all green, no skipped tests), `npx expo-doctor`, `npx expo install --check` (dependency versions).
2. Resolve every "Known issue" recorded in earlier handoffs or document why deferred.
3. Manual QA matrix on emulator(s): small phone, phone, tablet × portrait/landscape × font scale 1.0/1.5 × 2/3 players × 121/61 target. Cover: setup validation, saved-game replace prompt, scoring each kind, heels/crib dealer constraints, edit that changes the winner (truncation warning), delete, undo, next deal dealer rotation, skunk and double-skunk results, end early, abandon, app kill/restart persistence mid-game, ErrorBoundary reset clears cribbage data, reduce-motion setting, haptics toggle, TalkBack labels on the board and panels.
4. Performance: peg animation smooth; adding scores does not stutter on the mid-range emulator; no unnecessary re-renders of the static board layer. Step 6 already verified the architecture (native-driven pegs, memoised static layer) but the Android Studio emulators here render with SwiftShader (software GL, ~85-95 ms/frame even with the SVG hidden), so repeat the smoothness check on a real mid-range phone or a hardware-GPU emulator. Step 6 QA screenshots: `docs/qa/cribbage-board-*.png`; step 7 (score entry) QA screenshots: `docs/qa/cribbage-score-*.png` — still to check at font scale 1.5 (the score screen was only checked at the default scale; the form scrolls in portrait and the dense landscape form scrolls, so verify nothing important ends up below the fold).
5. Save screenshots to `docs/qa/` with names `cribbage-<screen>-<device>-<orientation>.png`.
6. Gin Rummy regression pass: setup, scoring, undo, game-over, continue card, rules page.
7. Docs: `README.md` (intro, "Adding a new game" notes learned from this work, svg/dev-build note); tick off the `docs/cribbage` plan as complete in the overview.
8. Release: bump `expo.version` and `expo.android.versionCode` in `app.json` (e.g. 1.1.0 / 2), `npx expo prebuild --platform android --clean`, `cd android && ./gradlew assembleRelease`, copy to `dist/CardKeeper-<version>.apk`, verify with `apksigner`, install with `adb install -r` and smoke test a complete cribbage game on the release build.

## Acceptance criteria
- All checks green; QA matrix complete with no open blockers.
- Release APK builds, is signed with the release key, installs over the previous version and keeps existing Gin Rummy data.

## Handoff (fill in when done)
- Final version / versionCode:
- APK path and `apksigner` result:
- QA results and screenshots list:
- Deferred issues / future ideas (e.g. card-counting helper, 4-player teams):

**Before ending:** commit `Cribbage step 10: QA and release 1.1.0` (or the chosen version).
