# Step 9 — Polish and QA

## Context
See `step-0.md`. All screens exist (Steps 4–8); _Step 8 must update this section with screens list and known rough edges_.

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
