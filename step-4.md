# Step 4 — Game selection screen

## Context
See `step-0.md`. Registry and store from Step 3 (_Step 3 must update this section with registry shape and the saved-game detection API_). Theme and `useResponsive` / `ScreenContainer` from Step 1.

## Goal
The app's home screen: pick a game type.

## Tasks
1. Home/menu screen: app title/logo header, grid of game cards from the registry. Grid columns by size class: compact = 1–2, medium = 2–3, expanded = 3–4. Cards show icon, name, short description, player count.
2. Available game → navigates to Gin Rummy flow. Unavailable → dimmed with a "Coming soon" badge, not tappable (or shows a small toast).
3. If a saved in-progress Gin Rummy game exists, show a "Continue game" banner/card (players + score) with Continue and Discard actions (confirm before discard).
4. Press feedback (scale/opacity), accessibility labels, large touch targets (≥48dp).
5. Looks right in portrait and landscape from ~360dp phone to ~1200dp tablet; check on emulators.
6. Wire navigation (router) with routes stubbed for Step 5 (`/gin/setup`) and later steps.

## Acceptance criteria
- Menu renders from the registry; adding a registry entry adds a card with no screen changes.
- Responsive grid verified on phone + tablet emulators, both orientations.
- Continue banner appears only when a saved game exists.

## Handoff notes (fill in when done)
- Route names/paths, shared components created (`GameCard`, etc.): _TBD_
- Update `step-5.md` with: navigation paths and which components to reuse.
