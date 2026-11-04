# Step 7 — Score entry screen

Read [../plan.md](../plan.md) first, then the Handoffs of steps [1](../step-01-engine/plan.md) and [2](../step-02-store/plan.md).

## Context from previous steps
- Store actions `addScore`, `updateScore`, `deleteScore`, selectors `selectDealer`, `selectTotals`, `selectContext`; engine `validateScore`, `SCORE_KINDS`, `MAX_EVENT_POINTS`, `HEELS_POINTS`.
- Reference: `src/app/gin/hand.tsx` and `src/features/handEntry/*` (`Keypad`, `DeadwoodField`, `HandPreview`, `handEntry.ts` + tests): modal presentation, unsaved-changes handling, edit mode via query param (`?handId=`), delete/confirmation, validation display.
- Board screen (step 8) does not exist yet; this route is reached by deep link/URL until then (`/cribbage/score`, `/cribbage/score?eventId=...` requires an existing game — create one in the dev console/setup screen from step 5).
- Register the modal animation in `src/app/_layout.tsx`: `<Stack.Screen name="cribbage/score" options={{ animation: 'slide_from_bottom' }} />`.

## Goal
`src/app/cribbage/score.tsx` + `src/features/scoreEntry/*`: add, edit and delete one scoring event quickly with one hand.

## Tasks
1. Pure helpers `src/features/scoreEntry/scoreEntry.ts` (+ test): form state `{ player, kind, pointsText }`, `parsePoints`, `toInput(form, deal)`, `previewTotals(totals, form, editingEvent?)` (resulting total & whether it wins), `initialFormFor(event | undefined, dealer)`, `errorsFor(form, ctx)` (use engine `validateScore`).
2. UI:
   - Player chips (2–3) with name and current total; dealer marked ("Dealer"/crib icon). Optional `?player=` param preselects.
   - Kind selector: Pegging, Hand, Crib, Heels (shown with the dealer-only constraint; selecting Heels auto-sets 2 points, selecting Crib preselects the dealer), Other.
   - Points entry using the existing `Keypad` (reuse/adapt; allow 1–29), large readout, quick buttons for common values (2, 4, 6, 8, 12 etc.) — keep to one row.
   - Live preview: "Alice 87 → 93" and "Wins the game!" when it reaches the target.
   - Buttons: Save (and "Save & add another" in add mode), Delete (edit mode, with confirmation), Cancel (confirm if dirty).
   - Validation messages inline; server-side (store) errors shown the same way.
3. Add mode: `addScore({ player, kind, points, deal: currentDeal })` then pop (or reset for "add another"). Edit mode: `updateScore`; if the edit changes who wins, the store handles truncation — warn the user in the confirmation when later events would be dropped (helper computes this).
4. Layout: no scroll on 360x640 portrait at default font scale; landscape uses two columns (kind/player left, keypad right). Haptics through `@/utils/haptics` like gin hand entry.
5. Guard: if there is no current game or the event id is missing, `Redirect` home/board.

## Acceptance criteria
- Add/edit/delete work and scores validate exactly like the engine (heels = 2 dealer-only, crib dealer-only).
- Hitting the target through entry ends the game and returns to the board (which will redirect to game-over in step 9).
- Helper tests cover preview, validation, drop-warning.

## Verify
`npm run lint && npm run typecheck && npm test`; manual run on emulator, portrait + landscape.

## Handoff (fill in when done)
- Files created/changed:
- Route params (`eventId`, `player`) and how the board should link to it:
- Helper signatures:
- Gotchas:
- Updates made to later step plans:

**Before ending:** update `step-08-board-screen/plan.md` with the route params; commit `Cribbage step 7: score entry`.
