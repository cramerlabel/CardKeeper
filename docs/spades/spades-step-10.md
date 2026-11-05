# Step 10 — QA, polish, docs, release build

Read [spades-plan.md](./spades-plan.md) first, then the Handoffs of **all** earlier spades steps (collect their "Known issues"). Also skim `docs/cribbage/step-10-qa-and-release/plan.md` and mirror its process.

## Context from previous steps
- Spades is fully playable (setup, scoreboard, hand entry, game-over). No new native dependencies were added for Spades, so a native Android regeneration should only be needed if other games (cribbage `react-native-svg`) added some since the last release — check `git log` and `package.json`.
- Existing QA conventions: screenshots in `docs/qa/` (phone/small/tablet, portrait/landscape, font scale 1.5), release process in `README.md` ("Building the release APK", "Bumping the version"), Android toolchain notes in the root `step-0.md`/`step-9.md`/`step-10.md` (JDK 17, `ANDROID_HOME`, emulator `emulator-5554`).

## Goal
Verify Spades end to end, fix what's found, update docs, and cut a release build.

## Tasks
1. Full automated check: `npm run lint && npm run typecheck && npm test` (and coverage for `src/games/spades/**` and the new `src/features/spades*` helpers — pure logic should be ~100%).
2. Cross-check rules vs engine: play through worked examples from `src/games/rules/spades.ts` by hand in the app and confirm the numbers (made/missed bid, bags and the 10-bag penalty, nil/blind nil, nil tricks as bags, both teams over target, floor loss).
3. Emulator QA with screenshots saved to `docs/qa/` (names like `spades-phone-scoreboard.png`, `spades-small-hand-font15.png`, `spades-tablet-hand.png`, `spades-gameover.png`): phone + small phone + tablet, portrait + landscape, font scale 1.5; setup with keyboard open; hand entry with all bid kinds; draft bids across an app restart; edit an old hand that changes a bag penalty and the winner; undo; end early; abandon; Continue card with several saved games (gin + cribbage + spades); ErrorBoundary reset clears spades.
4. Accessibility pass: labels on chips/steppers/panels, 48dp targets, contrast (`src/theme/contrast.test.ts` must stay green; warning/danger colours used by the bag meter need checking), screen-reader reading order of the hand-entry form.
5. Performance/robustness: a 30+ hand game scrolls smoothly; corrupt `card-keeper/spades` storage does not crash on launch.
6. Docs: README (playable games sentence, any features list, "Adding a new game" unchanged), mark the spades plan files as complete (add a short "Status: done" line at the top of `spades-plan.md`), and remove any stale "coming soon" wording for Spades.
7. Version bump and release build per the README ("Bumping the version", "Building the release APK"); install on the emulator and smoke test the release APK.
8. Fix any bugs found (add a regression test for each logic bug).

## Acceptance criteria
- Lint, typecheck and tests green; release APK builds, installs and plays a full Spades game.
- QA screenshots committed; known issues, if any, written to the Handoff.

## Verify
`npm run lint && npm run typecheck && npm test`, then the release build steps from the README.

## Handoff (fill in when done)
- Test/coverage results:
- Bugs found and fixed:
- Remaining known issues:
- Release version / artefact location:

**Before ending:** commit `Spades step 10: QA and release`.
