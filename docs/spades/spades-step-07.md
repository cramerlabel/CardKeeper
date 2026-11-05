# Step 7 — Hand entry (bids + tricks)

Read [spades-plan.md](./spades-plan.md) first, then the Handoffs of steps [2](./spades-step-02.md), [3](./spades-step-03.md) and [6](./spades-step-06.md).

## Context from previous steps
- Engine: `validateHand`, `scoreHand` (for a live preview), `getConfig`, `teamOf`, `TRICKS_PER_HAND`, `ERROR_*` constants. Store: `addHand`, `updateHand`, `saveDraftBids`, `currentGame.draftBids`, `hands` (for editing), `selectDealer`, `selectHandNumber`, `selectContext`.
- Reference: `src/app/gin/hand.tsx` (modal route, add/edit mode from params, keypad, validation, keyboard/landscape handling) and `src/features/handEntry/{handEntry.ts,Keypad,DeadwoodField,HandPreview}` + `handEntry.test.ts`. Gin registers it in `_layout.tsx` as `<Stack.Screen name="gin/hand" options={{ animation: 'slide_from_bottom' }} />`.
- The scoreboard (step 8) will open this route: `/spades/hand` (new hand) or `/spades/hand?handId=<id>` (edit).

## Goal
A fast, error-resistant way to enter four bids and four tricks counts and see the resulting score before saving.

## Tasks
1. Pure `src/features/spadesHandEntry/handEntry.ts` (+ test):
   - Form state `{ bids: (BidChoice | null)[4], tricks: (number | null)[4] }` where `BidChoice = { kind, bid }`; `initFromDraft`, `initFromHand(record)`, `setBid`, `setTricks`.
   - Auto-complete: when three tricks values are entered and the sum ≤ 13, offer/fill the fourth as `13 − sum` (flagged as suggested, user can override).
   - `toHandInput(form)` → `HandInput | null`; `validateForm(form, config)` → inline errors per field + a form-level message ("Tricks must add up to 13 — currently 11"); `canSaveBids(form)` (all four bids chosen) and `canScore(form)`.
   - `previewScores(form, config, previousBags)` → both teams' points for the live preview including the potential bag penalty (reuse `scoreHand` and the bag carry rule; do not re-implement the scoring).
   - Tests: init modes, auto-complete, every validation message, preview with and without bag penalty, blind-nil hidden when disabled.
2. Components (`src/features/spadesHandEntry/`):
   - `BidPicker`: row/grid of chips `Nil`, `Blind Nil` (only when enabled), `1`…`13` (two rows on phones), selected state, 48dp targets, accessibility labels ("Alice bid 4").
   - `TricksStepper` (or number chips 0–13) per player; large −/+ buttons plus value; shows suggested value styling.
   - `PlayerHandCard`: name, team badge, dealer marker, BidPicker, TricksStepper; partners grouped visually (team A card contains players 1 & 3, team B players 2 & 4) rather than strict seating order — document the choice.
   - `HandPreviewSummary`: per-team contract ("Bid 7 · took 8"), points breakdown (bid points, bags, nil ±, penalty) and new running total/bags.
3. Route `src/app/spades/hand.tsx`: add mode prefills bids from `draftBids`; edit mode (`handId`) prefills from the record and the preview uses the bags **before** that hand. Buttons: **Save bids** (add mode only, enabled when all four bids chosen; calls `saveDraftBids`, then back), **Score hand** (calls `addHand`/`updateHand`, shows engine error strings if rejected, then back), Cancel (confirm discard only if the form changed). Keyboard not required (chips/steppers), but support landscape and 360dp phones; the form scrolls with the action bar pinned.
4. Register `<Stack.Screen name="spades/hand" options={{ animation: 'slide_from_bottom' }} />` in `src/app/_layout.tsx`.
5. Haptics via `@/utils/haptics` consistent with gin (selection tick on chips, success on score).

## Acceptance criteria
- Can enter a full hand with only taps; the tricks sum rule is enforced with a clear message; blind nil only appears when enabled; edit mode round-trips an existing hand; bids can be saved and reappear after leaving and returning (and after app restart).
- Preview numbers equal what the store records after saving (add a test comparing `previewScores` to `computeHandResults` for the same hand).
- Manual check: 360dp phone portrait + landscape, tablet, font scale 1.3.

## Verify
`npm run lint && npm run typecheck && npm test`; emulator check (reach the route by deep link `cardkeeper://spades/hand` after starting a game from `/spades/setup`, since the scoreboard does not exist yet).

## Handoff (fill in when done)
- Files created/changed:
- Route params and navigation contract (`handId`):
- Helper signatures (`toHandInput`, `previewScores`, ...):
- UI decisions (grouping of players, auto-complete behaviour):
- Gotchas:
- Updates made to later step plans:

**Before ending:** update `spades-step-08.md` with the route contract; commit `Spades step 7: hand entry`.
