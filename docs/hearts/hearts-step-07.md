# Step 7 — Hand entry (hearts taken + queen of spades)

Read [hearts-plan.md](./hearts-plan.md) first, then the Handoffs of steps [2](./hearts-step-02.md), [3](./hearts-step-03.md) and [6](./hearts-step-06.md).

## Context from previous steps
- Engine: `validateHand`, `scoreHand` (live preview), `getConfig`, `HEARTS_PER_HAND`, `ERROR_*` constants. Store: `addHand`, `updateHand`, `currentGame.hands` (for editing), `selectDealer`, `selectHandNumber`, `selectPassDirection`, `selectTotals`, `selectContext`.
- Reference: `src/app/gin/hand.tsx` (modal route, add/edit mode from params, keypad, validation, keyboard/landscape handling) and `src/features/handEntry/{handEntry.ts,Keypad,DeadwoodField,HandPreview}` + `handEntry.test.ts`; Spades' `src/features/spadesHandEntry/*` if landed. Gin registers its modal in `_layout.tsx` as `<Stack.Screen name="gin/hand" options={{ animation: 'slide_from_bottom' }} />`.
- The scoreboard (step 8) will open this route: `/hearts/hand` (new hand) or `/hearts/hand?handId=<id>` (edit).

## Goal
A fast, error-resistant way to enter how many hearts each player took and who took the queen of spades, and see the resulting points before saving.

## Tasks
1. Pure `src/features/heartsHandEntry/handEntry.ts` (+ test):
   - Form state `{ hearts: (number | null)[4]; queen: PlayerIndex | null }`; `initEmpty`, `initFromHand(record)`, `setHearts`, `setQueen`, `shootMoon(player)` (sets 13 hearts for that player, 0 for the others, queen to that player).
   - Remaining counter: `heartsRemaining(form)` = 13 − sum of entered values (can go negative ⇒ error state).
   - Auto-complete: when three hearts values are entered and the sum ≤ 13, offer/fill the fourth as the remainder (flagged as suggested; the user can override).
   - `toHandInput(form)` → `HandInput | null`; `validateForm(form, config)` → inline errors per field + form-level message ("Hearts must add up to 13 — currently 11", "Pick who took the queen of spades"); `canScore(form)`.
   - `previewScores(form, config, previousTotals)` → each player's points for the hand, new running totals, whether the hand is a moon, and whether it would end the game (reuse `scoreHand`/`getOutcome`; do not re-implement scoring).
   - Tests: init modes, auto-complete, `shootMoon`, every validation message, preview for a normal hand, moon under both rules, hand that would end the game, tie-for-lowest (game continues).
2. Components (`src/features/heartsHandEntry/`):
   - `HeartsStepper` per player: large −/+ buttons plus a value (0–13), dealer marker, suggested-value styling, accessibility labels ("Alice hearts taken, 4"). Hold-to-repeat is optional.
   - `QueenPicker`: four chips (player names) with a ♠Q icon, exactly one selectable.
   - `MoonShortcut`: "Shot the moon" button opening a small chooser (which player) → calls `shootMoon`; shows an "active" state while the form is a moon.
   - `HandPreviewSummary`: per-player points for this hand and new total; moon banner ("Alice shot the moon — others +26" / "Alice −26" per rule); "Game ends: Bob wins" notice when the preview ends the game.
3. Route `src/app/hearts/hand.tsx`: add mode starts empty; edit mode (`handId`) prefills from the record and the preview uses the totals **before** that hand. Header shows "Hand N · Pass left · Dealer: Bob". Buttons: **Save hand** (calls `addHand`/`updateHand`, shows engine error strings if rejected, then back) and Cancel (confirm discard only if the form changed). No keyboard needed (steppers/chips); support landscape and 360dp phones; the form scrolls with the action bar pinned.
4. Register `<Stack.Screen name="hearts/hand" options={{ animation: 'slide_from_bottom' }} />` in `src/app/_layout.tsx`.
5. Haptics via `@/utils/haptics` consistent with gin (selection tick on steppers/chips, success on save).

## Acceptance criteria
- Can enter a full hand with only taps; the 13-hearts rule is enforced with a clear message; the queen must be chosen; the moon shortcut yields exactly the engine's moon result; edit mode round-trips an existing hand.
- Preview numbers equal what the store records after saving (add a test comparing `previewScores` to `computeHandResults` for the same hand).
- Manual check: 360dp phone portrait + landscape, tablet, font scale 1.3.

## Verify
`npm run lint && npm run typecheck && npm test`; emulator check (reach the route by deep link `cardkeeper://hearts/hand` after starting a game from `/hearts/setup`, since the scoreboard does not exist yet).

## Handoff (fill in when done)
- Files created/changed:
- Route params and navigation contract (`handId`):
- Helper signatures (`toHandInput`, `previewScores`, `shootMoon`, ...):
- UI decisions (auto-complete behaviour, moon shortcut, player ordering):
- Gotchas:
- Updates made to later step plans:

**Before ending:** update `hearts-step-08.md` with the route contract; commit `Hearts step 7: hand entry`.
