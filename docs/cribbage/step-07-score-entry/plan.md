# Step 7 — Score entry screen

Read [../plan.md](../plan.md) first, then the Handoffs of steps [1](../step-01-engine/plan.md) and [2](../step-02-store/plan.md).

## Context from previous steps
- Store actions `addScore`, `updateScore`, `deleteScore`, selectors `selectDealer`, `selectTotals`, `selectContext`; engine `validateScore`, `SCORE_KINDS`, `MAX_EVENT_POINTS`, `HEELS_POINTS`.
- Reference: `src/app/gin/hand.tsx` and `src/features/handEntry/*` (`Keypad`, `DeadwoodField`, `HandPreview`, `handEntry.ts` + tests): modal presentation, unsaved-changes handling, edit mode via query param (`?handId=`), delete/confirmation, validation display.
- Board screen (step 8) does not exist yet; this route is reached by deep link/URL until then (`/cribbage/score`, `/cribbage/score?eventId=...` requires an existing game — create one in the dev console/setup screen from step 5).
- Register the modal animation in `src/app/_layout.tsx`: `<Stack.Screen name="cribbage/score" options={{ animation: 'slide_from_bottom' }} />`.
- Real store API (step 2): `addScore(input: NewScoreInput)` where `deal` is **optional** (defaults to the game's current `deal`; an explicit later deal bumps the game's deal) and fails when no game / game finished / invalid. `updateScore(id, input: ScoreInput)` needs a full `ScoreInput` including `deal`; it rebuilds all events (renumber, **drops events after a win — permanently**), reopens the game if it is no longer won, and returns `ActionResult` with the engine's `ERROR_*` strings. `deleteScore(id)` / `undoLastScore()` also return `ActionResult`. `selectDealer(state)` is `PlayerIndex | null`; `selectContext(state)` is `GameContext | null` (stable object); `selectTotals`/`selectPegs` return stable empty arrays with no game. Events are flat (`ScoreEvent` = `{ id, number, player, kind, points, deal }`), so an editor builds a `ScoreInput` from `{player, kind, points, deal}`.

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
  - New: `src/app/cribbage/score.tsx` (route: hydration gate -> `ScoreEntry` guard/snapshot -> `ScoreEntryForm`); `src/features/scoreEntry/{scoreEntry.ts, PlayerChips.tsx, KindSelector.tsx, PointsReadout.tsx, QuickPoints.tsx}`; tests `scoreEntry.test.ts` (pure helpers) and `scoreEntryScreen.test.tsx` (screen against the real store with mocked `expo-router`/haptics/`@expo/vector-icons`, as in `cribbageSetupScreen.test.tsx`).
  - Changed: `src/app/_layout.tsx` (`cribbage/score` registered with `slide_from_bottom`); `src/features/handEntry/Keypad.tsx` (new optional `keyHeight` prop; gin unchanged).
  - QA screenshots (Pixel 7 emulator, API 35): `docs/qa/cribbage-score-{phone-portrait-360x640-3p,phone-portrait-heels,phone-landscape-3p,tablet-landscape-3p}.png`.
- Route params (`eventId`, `player`) and how the board should link to it:
  - Add: `router.push('/cribbage/score' as never)`; add for a player: `'/cribbage/score?player=<0|1|2>'` (ignored when out of range; without it the form starts on the player left of the dealer, i.e. the one who leads the play).
  - Edit/delete: `'/cribbage/score?eventId=<event.id>'` (`player` is ignored in edit mode). The screen needs no callbacks: it calls the store and `router.back()`s, so the board just re-renders from the store.
  - Guards: no game -> `<Redirect href="/">`; unknown `eventId`, or adding to a finished game -> `<Redirect href="/cribbage/board">`. Closing uses `router.back()` and falls back to `router.replace('/cribbage/board')` when there is no history (deep link).
  - A score that reaches the target ends the game through the store (`status: 'finished'`) and the modal closes: the board's focus effect must redirect to `/cribbage/game-over` (step 8 task 7 / step 9).
- Helper signatures (`@/features/scoreEntry/scoreEntry`; all pure):
  - `type ScoreForm = { player: PlayerIndex; kind: ScoreKind; pointsText: string }`; `type ScorePreview = { before; after; wins; dropped }`; `type ScoreMessage = { tone: 'neutral'|'ok'|'error'; lines: string[]; notes: string[] }`.
  - `parsePoints(text): number | null` (1–2 digits only), `appendDigit(text, digit)` (a digit that would exceed 29 starts a new number, a stray zero is ignored), `removeLastDigit(text)`, `toInput(form, deal): ScoreInput` (empty points => `NaN`, so the engine rejects it).
  - `errorsFor(form, deal, ctx): string[]` = engine `validateScore`, minus the points errors while `pointsText === ''`. (The plan said `errorsFor(form, ctx)`; the dealer depends on the event's `deal`, so `deal` was added.)
  - `previewTotals(events, form, deal, ctx, editing?): ScorePreview | null` (plan said `(totals, form, editingEvent?)`): rebuilds the events with the engine exactly as the store would (add = append, edit = replace in place), so caps, wins and truncation are exact. `before` = the player's current total, `after` = total after saving, `wins` = that player wins the game, `dropped` = later events an edit would permanently remove. `null` until the form is valid. Edit mode shows `Alice: 87 → 87` when nothing changes.
  - `initialFormFor(event | undefined, dealer, playerCount, preselected?)`, `changeKind(form, kind, dealer)` (heels => dealer + 2 points, crib => dealer), `isDirty(form, baseline)`, `parsePlayerParam(raw, playerCount)`, `quickPointsFor(kind)` (6 values; none for heels), `isDealerOnly`, `kindLabel`, `kindHint(kind, dealerName)`, `buildMessage({ errors, saveErrors, preview, playerName, notice })`, `describeDropped(count)`, `describeScore(event, names)` ("Bob +6 (Hand)"), constants `WINS_NOTE`, `HEELS_NOTE`.
- Gotchas:
  - The form works on a **snapshot of the game taken at mount** (`useCribbageStore.getState()`; it only re-reads the store after "Save & add another"). Saving/deleting renumbers or removes the edited event while the modal slides away, so subscribing live would flash recalculated totals and trigger the guards. Do not turn it into a store subscription. (Reading a ref during render is rejected by `react-hooks/refs`, which is why a snapshot is used.)
  - Unsaved changes: `usePreventRemove` from `expo-router` (also covers Android back and swipe-back); the X button just calls `goBack`. After a successful save/delete call `disablePrevention()` before navigating (`leave()` does both).
  - Dealer-only kinds: choosing Crib selects the dealer, choosing His heels selects the dealer and sets 2 points (keypad disabled, the quick row is replaced by a note). Choosing another player afterwards is not blocked: the engine's `ERROR_CRIB_DEALER`/`ERROR_HEELS_DEALER` message is shown inline and Save is disabled. The dealer is that of the **event's** deal when editing.
  - "Save & add another" resets the form to the default player/kind/empty points, keeps the same deal, and shows "Added Bob +6 (Hand)". If the score wins the game the modal closes instead.
  - Layout: `tight` (portrait, window height < 720dp) uses 6dp gaps, a 40dp close button (+8dp hitSlop), 48dp keypad keys and hides the kind hint line, which fits a 3-player form on 360x640 dp (24dp gesture bar, 36dp status bar) without scrolling; taller phones get the hint and more spacing, and the keypad block is pinned to the bottom. `isDense` (landscape, height < 480dp) puts Save / Save & add another (Delete in edit mode) in the header, the form in a scroll area (bleeding 16dp into the bottom padding so the quick row is not clipped) and a narrower keypad (flex 0.8). Taller landscape (tablets) uses two columns like gin. The five kind chips wrap onto two rows if the column is too narrow.
  - In Jest `@expo/vector-icons` must be mocked (`jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }))`) because `expo-asset` is not resolvable there.
  - Dev builds show a "Looks like you have configured linking in multiple places" toast when a deep link is delivered to an already running app (e.g. `adb ... -d cardkeeper://cribbage/score`); cold-start the app for clean screenshots.
- Updates made to later step plans: step 8 "Context from previous steps" now lists the real route params and the finish/redirect contract.

**Before ending:** update `step-08-board-screen/plan.md` with the route params; commit `Cribbage step 7: score entry`.
