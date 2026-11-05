# Step 10 — QA, polish, docs, release build

Read [hearts-plan.md](./hearts-plan.md) first, then the Handoffs of **all** earlier hearts steps (collect their "Known issues"). Also skim `docs/cribbage/step-10-qa-and-release/plan.md` and `docs/spades/spades-step-10.md` and mirror their process.

## Context from previous steps
- Hearts is fully playable (setup, scoreboard, hand entry, game-over). No new native dependencies were added for Hearts, so a native Android regeneration should only be needed if other games (e.g. cribbage `react-native-svg`) added some since the last release — check `git log` and `package.json`.
- Existing QA conventions: screenshots in `docs/qa/` (phone/small/tablet, portrait/landscape, font scale 1.5), release process in `README.md` ("Building the release APK", "Bumping the version"), Android toolchain notes in the root `step-0.md`/`step-9.md`/`step-10.md` (JDK 17, `ANDROID_HOME`, emulator `emulator-5554`).

## Goal
Verify Hearts end to end, fix what's found, update docs, and cut a release build.

## Tasks
1. Full automated check: `npm run lint && npm run typecheck && npm test` (and coverage for `src/games/hearts/**` and the new `src/features/hearts*` helpers — pure logic should be ~100%).
2. Cross-check rules vs engine: play through the worked examples from `src/games/rules/hearts.ts` by hand in the app and confirm the numbers (hearts + queen scoring, shooting the moon under both rules, tie for lowest continuing, lowest wins at ≥ target, negative totals).
3. Emulator QA with screenshots saved to `docs/qa/` (names like `hearts-phone-scoreboard.png`, `hearts-small-hand-font15.png`, `hearts-tablet-hand.png`, `hearts-gameover.png`): phone + small phone + tablet, portrait + landscape, font scale 1.5; setup with keyboard open; moon shortcut; edit an old hand that changes the winner; undo; end early; abandon; Continue card with several saved games (gin + cribbage + spades + hearts); ErrorBoundary reset clears hearts.
4. Accessibility pass: labels on steppers/chips/panels, 48dp targets, contrast (`src/theme/contrast.test.ts` must stay green; check the warning/danger colours on the progress bars), screen-reader reading order of the hand-entry form.
5. Performance/robustness: a 30+ hand game scrolls smoothly; corrupt `card-keeper/hearts` storage does not crash on launch.
6. Docs: README (playable games sentence, any features list, "Adding a new game" unchanged), mark the hearts plan files as complete (add a short "Status: done" line at the top of `hearts-plan.md`), and remove any stale "coming soon" wording for Hearts.
7. Version bump and release build per the README ("Bumping the version", "Building the release APK"); install on the emulator and smoke test the release APK.
8. Fix any bugs found (add a regression test for each logic bug).

## Acceptance criteria
- Lint, typecheck and tests green; release APK builds, installs and plays a full Hearts game.
- QA screenshots committed; known issues, if any, written to the Handoff.

## Verify
`npm run lint && npm run typecheck && npm test`, then the release build steps from the README.

## Handoff (fill in when done)
- Test/coverage results:
- Bugs found and fixed:
- Remaining known issues:
- Release version / artefact location:

**Before ending:** commit `Hearts step 10: QA and release`.
