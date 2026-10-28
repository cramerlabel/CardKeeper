# Step 0 — Android build environment

## Project overview (read first — applies to every step)
- App: card-game score keeper for Android phones and tablets. React Native with **Expo (managed) + TypeScript**. Gin Rummy first; more games later via a game registry.
- Location: `/Users/steve/Projects/Cards`. Not a git repo yet (git init happens in Step 1).
- Output: a side-loadable `.apk` built **locally** (no EAS cloud). Android only for now.
- Must look polished and professional and be responsive from small phones to large tablets, portrait and landscape. In-progress games auto-save.
- Workflow: one `step-N.md` per step. When you finish a step, fill in that file's **Handoff notes** and **update `step-(N+1).md`** with anything the next session needs (versions, paths, decisions, file names, gotchas).

## Gin Rummy rules (authoritative, used by later steps)
- Hand types: Knock, Gin (0 deadwood), Big Gin (11 cards, 0 deadwood).
- Knock: knocker deadwood must be ≤ 10. If knocker < opponent: knocker scores the difference. If opponent ≤ knocker: **undercut**, opponent scores 25 + (knocker − opponent).
- Gin: knocker scores 25 + opponent deadwood (cannot be undercut). Big Gin: 31 + opponent deadwood.
- Game ends when a player's total is ≥ 100.
- Final score: winner gets +100 game bonus (**200 if shutout**, i.e. loser won zero hands); each player gets +25 per hand won (box bonus). Higher final total wins.
- Keep all bonus constants in one configurable object.

## Current machine state (checked at planning time)
- macOS, Node v24.15.0, npm 11.12.1, git available.
- **No Java, no Android SDK, no ANDROID_HOME, no adb.** Homebrew availability unchecked.

## Goal
Install and verify everything needed to build an Android release APK locally.

## Tasks
1. Check Homebrew (`brew -v`); install if missing (ask the user before installing).
2. Install JDK 17 (e.g. `brew install --cask temurin@17`); set `JAVA_HOME` (`/usr/libexec/java_home -v 17`).
3. Install Android command-line tools (`brew install --cask android-commandlinetools`) or Android Studio.
4. Set `ANDROID_HOME` (e.g. `~/Library/Android/sdk`) and add `platform-tools`, `cmdline-tools/latest/bin` to `PATH`. Persist in `~/.zshrc` (tell the user what you changed).
5. `sdkmanager --licenses`, then install: `platform-tools`, `platforms;android-35` (or the level the Expo SDK chosen in Step 1 needs), `build-tools;35.0.0`, `ndk` only if Gradle asks for it.
6. Optional: create an emulator (`system-images;android-35;google_apis;arm64-v8a`) for tablet and phone testing; at least a phone AVD and a tablet AVD.
7. Verify: `java -version`, `adb version`, `sdkmanager --list_installed`.

## Acceptance criteria
- `java -version` reports 17.
- `adb version` works; `echo $ANDROID_HOME` is set in a new shell.
- Required platform and build-tools are installed with licenses accepted.

## Handoff notes (fill in when done)
- Installed versions/paths: DONE. Machine is an **Intel (x86_64) Mac**, macOS 26.7.1, Homebrew 5.1.13 at `/usr/local` (Tier 3, so no bottles for many formulae: `brew install openjdk@17` compiled from source and was abandoned).
  - JDK: Temurin 17.0.20.1 via `brew install --cask temurin@17` (user ran it, needs sudo) at `/Library/Java/JavaVirtualMachines/temurin-17.jdk`.
  - Android cmdline-tools: `brew install --cask android-commandlinetools` (binaries in `/usr/local/share/android-commandlinetools`), then installed `cmdline-tools;latest` 23.0.0 into the SDK root.
  - SDK root: `~/Library/Android/sdk`. Installed: platform-tools 37.0.1, platforms android-35 and android-36, build-tools 35.0.0 and 36.0.0, emulator 37.2.12, system image `android-35;google_apis;x86_64`. Licenses accepted. NDK not installed (let Gradle request it).
  - Latest Expo on npm at the time: `expo@58.0.19` (not verified which compileSdk/build-tools it needs; install them with sdkmanager if Gradle complains).
- Shell profile edits: created `~/.zshrc` (did not exist) setting `JAVA_HOME` (`/usr/libexec/java_home -v 17`), `ANDROID_HOME` and `ANDROID_SDK_ROOT` (`~/Library/Android/sdk`), and PATH additions for `$JAVA_HOME/bin`, `platform-tools`, `cmdline-tools/latest/bin`, `emulator`. Verified in a fresh `zsh -i`.
- Emulators created: `Pixel_7_API_35` (phone) and `Pixel_Tablet_API_35` (tablet), x86_64 Google APIs images (Intel host, so no arm64). Start with `emulator -avd Pixel_7_API_35`. Not yet booted.
- Update `step-1.md` with: exact JDK/SDK/platform versions and env var values. (Done.)
