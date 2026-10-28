# Step 10 — Release APK build and sideload

## Context
See `step-0.md` (toolchain: JDK 17, Android SDK, `ANDROID_HOME`) and `step-9.md` handoff (final `app.json`, assets) — _Step 9 must update this section_.

## Goal
Produce a release `.apk` that can be side-loaded onto Android phones and tablets.

## Tasks
1. Set `version` and `android.versionCode` in `app.json`; confirm `android.package`.
2. `npx expo prebuild --platform android --clean` (generates `android/`). Commit `android/` or keep it ignored and document regenerating it (decide; recommended ignore + document).
3. Signing: generate a release keystore with `keytool` (store outside the repo or git-ignored, e.g. `~/keystores/cardkeeper.jks`), configure `android/gradle.properties` (secrets NOT committed) and `android/app/build.gradle` signingConfigs. Back up the keystore and tell the user where it is and that losing it blocks updates.
4. Build: `cd android && ./gradlew assembleRelease`. Output: `android/app/build/outputs/apk/release/app-release.apk`. Ensure it's an APK (not AAB). Consider `abiFilters` (arm64-v8a, armeabi-v7a, x86_64 for emulator) to reduce size.
5. Verify: `apksigner verify --print-certs`, install via `adb install -r app-release.apk` on an emulator/device, run through a whole game (start → hands incl. gin/big gin/undercut → game over → new game), rotation, kill/restart resume.
6. Copy the APK to a convenient path (e.g. `dist/CardKeeper-<version>.apk`) and write `README.md` with: build steps, how to sideload (enable "Install unknown apps", `adb install`, or file transfer), how to bump version, how to add a new game (registry + module).

## Acceptance criteria
- A signed release APK installs and runs on an Android emulator (and device if available) without a dev server.
- README documents build and sideload.

## Handoff notes (fill in when done)
- APK path, version, keystore location, remaining ideas (add more games, iOS, Play Store AAB): _TBD_
