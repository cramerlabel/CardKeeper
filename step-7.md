# Step 7 — Hand entry screen

## Context
See `step-0.md` (rules) and `step-2.md` (engine: `validateHandInput`, `scoreHand`). Scoreboard info from Step 6:
- Route: `/gin/hand` (stub at `src/app/gin/hand.tsx` — replace its body, keep the path). Typed routes are off, so navigation uses `as never`.
- **Add**: scoreboard does `router.push('/gin/hand')` (no params). **Edit**: tapping a history row does `router.push('/gin/hand?handId=<HandRecord.id>')`; read it with `useLocalSearchParams<{ handId?: string }>()` and look the hand up in `currentGame.hands` (prefill `input.knocker`, `input.kind`, `input.deadwood`). No player context beyond `handId` is passed; player names come from `currentGame.players`. `updateHand` truncates later hands if the edited hand ends the game, so warn the user when editing a non-last hand.
- **Closing**: after a successful `addHand`/`updateHand`, just `router.back()`. Do NOT navigate to game over yourself: the scoreboard (focused again) sees `currentGame.status === 'finished'` and does `router.replace('/gin/game-over')`.
- `src/features/scoreboard/history.ts` has `OUTCOME_LABELS` (Knock / Undercut / Gin / Big Gin) for reuse in the live preview. `useTextScale` (same folder) is the short-side text scaler used on the scoreboard.
- Emulator test tip: seed a game by writing `{"state":{"currentGame":…,"history":[]},"version":1}` into `catalystLocalStorage` (key `card-keeper/gin-rummy`) in the app's `databases/RKStorage` via `adb shell run-as com.steve.cardkeeper sqlite3`; remember deadwood is indexed by player and must be ≤ 10 for the knocker on a knock.

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
- DONE. Route `/gin/hand` (`src/app/gin/hand.tsx`): add mode with no params, edit mode with `?handId=`. No engine changes.
- Pure logic (tested, `src/features/handEntry/handEntry.ts`): `EntryState` (knocker, kind, deadwood as typed strings), `evaluateEntry` (uses the engine's `validateHandInput`/`scoreHand`; returns `incomplete` / `invalid` / `ready` with message + `endsGame`), locking rules (`isLocked`, `changeKind`, `changeKnocker`), digit helpers (`appendDigit` caps at `maxDeadwood`, `stepDeadwood`). Knocker errors (e.g. knock over 10, knock with 0) show as soon as the knocker's deadwood is typed.
- UI: `src/components/SegmentedControl.tsx` (new, reusable), `src/features/handEntry/{Keypad,DeadwoodField,HandPreview}.tsx`. Custom keypad only, no system keyboard. Tap a deadwood card to select it; −/+ steppers per player; Gin/Big Gin lock the knocker's field at 0 and the other field becomes active.
- Save: `addHand` or `updateHand`, then `router.back()`; the scoreboard handles the game-over redirect. Store errors are shown in the preview box. Editing a hand that is not the last asks for confirmation first. The edited hand is captured at mount so `updateHand` removing it can't trigger a redirect mid-navigation. A `saved` ref blocks double-tap saves.
- Layouts: single scrolling column on compact portrait; two columns (form left, keypad + Save right) for landscape or expanded; "dense" landscape (height < 480dp, e.g. phone on its side) puts Save in the header, shows knocker/hand-type pickers side by side, hides labels/steppers, and only the form scrolls. `useResponsive` gained `isDense` (and exported `DENSE_MAX_HEIGHT`); the scoreboard now uses it too.
- Verified on the Pixel 7 emulator (restarted after it hung): add knock / gin / big gin, invalid knock (11) blocked, edit non-last hand with confirm and recalculated totals, game-ending hand redirects to the game-over stub, portrait + landscape; and a tablet-sized display (`wm size 1600x2560`, density 240) in portrait and landscape. Real `Pixel_Tablet_API_35` AVD still not booted.
- Rough edge: on tall tablets the form is top-aligned with empty space below.
- `step-8.md` updated.
