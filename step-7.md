# Step 7 — Hand entry screen

## Context
See `step-0.md` (rules) and `step-2.md` (engine: `validateHandInput`, `scoreHand`). Scoreboard info from Step 6 (_Step 6 must update this section_).

## Goal
Both players enter their deadwood at the end of a hand; the app computes the points and records the hand. Supports Gin and Big Gin.

## Tasks
1. Screen/modal with: "Who went out?" selector (player 1 / player 2), hand type selector (Knock / Gin / Big Gin), and a deadwood number input per player.
2. Gin: knocker's deadwood auto-set to 0 and locked; opponent's deadwood still entered. Big Gin same (label hints 11 cards).
3. Custom numeric keypad or `keyboardType="number-pad"` (prefer a custom large keypad for tablets); quick increment/clear.
4. Live preview line: "Alice wins 14 points (Knock)" / "Undercut! Bob wins 28" using the engine. Show validation errors from the engine (e.g. knock needs ≤ 10) and disable Save.
5. Save → `addHand`; return to scoreboard; if game over, go to Step 8 flow.
6. Edit mode: reuse the screen to edit a previous hand (`updateHand`) from the history list.
7. Layout: single column on compact; two-column on expanded/landscape. Test with keyboard.

## Acceptance criteria
- All outcomes match the engine tests: knock, undercut, gin, big gin.
- Invalid entries cannot be saved; helpful messages shown.
- Works in portrait/landscape on phone and tablet.

## Handoff notes (fill in when done)
- Route names, components, any engine changes made: _TBD_
- Update `step-8.md` with: how game-over is detected and what store data is available.
