# Step 10 — Release APK build and sideload

## Context
See `step-0.md` (toolchain: JDK 17, Android SDK, `ANDROID_HOME`) and the Step 9 handoff. Final values from Step 9:
- `app.json`: name `Card Keeper`, slug `card-keeper`, `version` `1.0.0`, `android.package` / `ios.bundleIdentifier` `com.steve.cardkeeper`, `android.versionCode` `1`, scheme `cardkeeper`, `orientation: default`, `userInterfaceStyle: dark`, `backgroundColor` `#0B3D2E`.
- Assets (regenerate with `python3 scripts/generate-assets.py`, needs Pillow): `assets/icon.png` (1024), `assets/android-icon-background.png`, `assets/android-icon-foreground.png`, `assets/android-icon-monochrome.png`, `assets/splash-icon.png`, `assets/favicon.png`. Splash colour `#0B3D2E`, `imageWidth` 220 via the `expo-splash-screen` plugin.
- Plugins: `expo-router`, `expo-font`, `expo-splash-screen`, `expo-system-ui`, `expo-navigation-bar` (new native modules since Step 8 → prebuild must be re-run; `android/` is git-ignored and was regenerated with `npx expo prebuild --platform android --clean`).
- Debug build workflow used for QA: `npx expo run:android --device emulator-5554 --port 8081` (builds ~12 min cold, then serves Metro; first JS load after a relaunch takes ~10s).
- A debug `app-debug.apk` is at `android/app/build/outputs/apk/debug/`; the release build, signing and `abiFilters` are still to do.

## Goal
Produce a release `.apk` that can be side-loaded onto Android phones and tablets.

## Tasks
1. Set `version` and `android.versionCode` in `app.json`; confirm `android.package`.
2. `npx expo prebuild --platform android --clean` (generates `android/`). Commit `android/` or keep it ignored and document regenerating it (decide; recommended ignore + document).
3. Signing: generate a release keystore with `keytool` (store outside the repo or git-ignored, e.g. `~/keystores/cardkeeper.jks`), configure `android/gradle.properties` (secrets NOT committed) and `android/app/build.gradle` signingConfigs. Back up the keystore and tell the user where it is and that losing it blocks updates.
4. Build: `cd android && ./gradlew assembleRelease`. Output: `android/app/build/outputs/apk/release/app-release.apk`. Ensure it's an APK (not AAB). Consider `abiFilters` (arm64-v8a, armeabi-v7a, x86_64 for emulator) to reduce size.
5. Verify: `apksigner verify --print-certs`, install via `adb install -r app-release.apk` on an emulator/device, run through a whole game (start → hands incl. gin/big gin/undercut → game over → new game), rotation, kill/restart resume.
6. Copy the APK to a convenient path (e.g. `dist/CardKeeper-<version>.apk`) and write `README.md` with: build steps, how to sideload (enable "Install unknown apps", `adb install`, or file transfer), how to bump version, how to add a new game (registry + module + rules page content in `src/games/rules/`, registered in `src/games/rules/index.ts`).

## Acceptance criteria
- A signed release APK installs and runs on an Android emulator (and device if available) without a dev server.
- README documents build and sideload.

## Handoff notes (fill in when done)
- APK: `dist/CardKeeper-1.0.0.apk` (git-ignored; 67 MB, arm64-v8a + armeabi-v7a + x86_64), version `1.0.0` / versionCode `1`, signed with the release key (SHA-256 `11:8E:47:87:…:8E:3E:B9`).
- Keystore: `~/keystores/cardkeeper.jks` (alias `cardkeeper`); credentials in `~/.gradle/gradle.properties` (`CARDKEEPER_*`). **Back both up — losing them blocks updates.**
- `android/` stays git-ignored; `plugins/withReleaseSigning.js` re-applies signing config and ABI list on every prebuild.
- Verified on emulator-5554 with no Metro: launch, new game, add hand, kill/restart resume ("Continue game"), landscape rotation. Full gin/big gin/undercut run-through was not repeated in release (covered by unit tests and Step 8 QA).
- Remaining ideas: more games (Hearts/Spades/Euchre), iOS build, Play Store AAB (`./gradlew bundleRelease`), per-ABI APK splits to shrink size.
