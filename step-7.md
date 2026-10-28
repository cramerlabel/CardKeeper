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
- Route names, components, any engine changes made: _TBD_
- Update `step-8.md` with: how game-over is detected and what store data is available.
