# Step 5 — New game setup (player names)

## Context
See `step-0.md`. Routes/components from Step 4 (_Step 4 must update this section_). Store `startGame(names)` from Step 3.

## Goal
Screen to enter Player 1 and Player 2 names and start a Gin Rummy game.

## Tasks
1. Setup screen: two name inputs (labels "Player 1", "Player 2"), max length (~20), trimmed; defaults/placeholders "Player 1"/"Player 2" if left empty is allowed (decide: recommended allow default names).
2. Validation: names must differ (case-insensitive) — inline error; Start button disabled until valid.
3. Keyboard handling (KeyboardAvoidingView / scroll), `returnKeyType` next/done, works in landscape and on tablets (centered card with max width).
4. Remember last-used names (prefill) — store in AsyncStorage via the store or a small settings slice.
5. Start → calls `startGame`, navigates to the scoreboard route (Step 6; stub screen ok).
6. If a saved game exists and user starts a new one, confirm that it will replace it.

## Acceptance criteria
- Can start a game with valid names; invalid input is blocked with clear messages.
- Layout good on small phone with keyboard open and on tablets in both orientations.

## Handoff notes (fill in when done)
- Route names, components: _TBD_
- Update `step-6.md` with: scoreboard route, store selectors available.
