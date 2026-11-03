# Card Keeper

Card-game score keeper for Android phones and tablets, built with Expo (SDK 58) and Expo Router. Gin Rummy is playable; Hearts, Spades and Euchre are "coming soon" placeholders with rules pages.

## Development

```bash
npm install
npx expo run:android --device emulator-5554 --port 8081   # debug build + Metro
npm run lint && npm run typecheck && npm test
```

## Building the release APK

Prerequisites: JDK 17, Android SDK (`ANDROID_HOME` set), Node.

`android/` is generated and git-ignored. Regenerate it any time native config changes:

```bash
npx expo prebuild --platform android --clean
```

The local config plugin [plugins/withReleaseSigning.js](plugins/withReleaseSigning.js) (registered in `app.json`) re-applies the release signing config and limits ABIs to `armeabi-v7a`, `arm64-v8a` and `x86_64` on every prebuild.

### Signing

The release keystore lives **outside the repo** at `~/keystores/cardkeeper.jks` (alias `cardkeeper`). Its credentials are in `~/.gradle/gradle.properties`:

```properties
CARDKEEPER_STORE_FILE=/Users/<you>/keystores/cardkeeper.jks
CARDKEEPER_STORE_PASSWORD=...
CARDKEEPER_KEY_ALIAS=cardkeeper
CARDKEEPER_KEY_PASSWORD=...
```

> **Back up the keystore and its passwords** (e.g. a password manager plus an offline copy). Android only installs an update over an existing install if it is signed with the same key — if the keystore is lost, existing users must uninstall and reinstall (losing local data).

Without these properties the release build falls back to the debug key (installable, but not suitable for distribution).

To create a new keystore:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore ~/keystores/cardkeeper.jks \
  -alias cardkeeper -keyalg RSA -keysize 2048 -validity 10000
```

### Build

```bash
cd android && ./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk
mkdir -p ../dist && cp app/build/outputs/apk/release/app-release.apk ../dist/CardKeeper-1.0.0.apk
```

Verify the signature:

```bash
$ANDROID_HOME/build-tools/36.0.0/apksigner verify --print-certs dist/CardKeeper-1.0.0.apk
```

## Sideloading

- **adb** (USB debugging or wireless): `adb install -r dist/CardKeeper-1.0.0.apk`
- **File transfer**: copy the APK to the device (USB, cloud drive, email), open it in a file manager, and allow **Install unknown apps** for that app when prompted (Settings → Apps → Special access → Install unknown apps).

## Bumping the version

In `app.json` update both:

- `expo.version` (shown to users, e.g. `1.0.1`)
- `expo.android.versionCode` (integer; must increase on every release)

Then re-run `npx expo prebuild --platform android --clean` and build again, naming the copy `dist/CardKeeper-<version>.apk`.

## Adding a new game

1. **Registry** — add (or flip `available: true` on) an entry in [src/games/registry.ts](src/games/registry.ts): `id`, `name`, `description`, `route`, `icon` (MaterialCommunityIcons name), `playerCount`.
2. **Game module** — implement the engine/store/screens under `src/games/<gameId>/` and the routes under `src/app/<route>/` (see `src/games/ginRummy` and `src/app/gin`).
3. **Rules page** — create `src/games/rules/<gameId>.ts` exporting a `GameRules` object (see [types.ts](src/games/rules/types.ts)) and register it in [src/games/rules/index.ts](src/games/rules/index.ts) under the same `id`. Every game in the registry must have rules content (checked by `rules.test.ts`).
