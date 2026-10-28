# Step 8 — Game over screen

## Context
See `step-0.md` (final score rules) and `step-2.md` (`computeFinalScore`). Detection/store details from Step 7 (_Step 7 must update this section_).

## Goal
When a player reaches ≥ 100, declare the winner and show the official final score.

## Tasks
1. Winner banner (name, trophy/celebration visual, subtle animation, haptic).
2. Score breakdown table per player: running total, game bonus (100, or 200 for shutout — label "Shutout!"), box bonus (hands won × 25), **final score**. Show hands won count.
3. Buttons: **New Game** (same players: prefilled setup or immediate restart — offer "Rematch" with same names and "New game" to setup) and **Return to Menu**. Optionally "View hand history".
4. Store: mark game finished, persist, add to finished-game history; ensure leaving the screen clears the in-progress save so "Continue" does not offer a finished game (or offers read-only result — decide and document).
5. Back-button handling so users can't re-enter an ended game by accident.
6. Responsive layout for all sizes/orientations.

## Acceptance criteria
- Reaching 100 shows correct winner and final breakdown matching engine tests, including a shutout case.
- New Game / Menu both work; no stale game state remains.

## Handoff notes (fill in when done)
- Decisions on finished-game persistence and rematch: _TBD_
- Update `step-9.md` with: list of screens, known visual rough edges, any TODOs.
