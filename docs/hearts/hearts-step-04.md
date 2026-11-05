# Step 4 — Rules refresh, registry route, shared UI for 4 players

Read [hearts-plan.md](./hearts-plan.md) first, then the Handoffs of steps [1](./hearts-step-01.md)–[3](./hearts-step-03.md) **and the Handoff of cribbage step 4** (`docs/cribbage/step-04-rules-and-shared-ui/plan.md`). If Spades step 4 has landed, also read `docs/spades/spades-step-04.md` (Handoff) — it solves most of the same shared-UI problems.

## Context from previous steps
- **Prerequisite:** cribbage step 4 is committed. It generalised `ContinueGameCard` (`players`/`totals` arrays, built for 2–3 columns), added a saved-games builder (`src/features/home/savedGames.ts`), list-based name helpers (`validateNameList`, `loadLastNames(storage, key)`), `NameField` (`src/features/setup/NameField.tsx`) and the cribbage `clear()` call in the `_layout.tsx` ErrorBoundary. If any of that is missing or named differently, read the cribbage Handoff and the current code first; **extend those helpers, do not duplicate them**. If cribbage step 4 is genuinely not done, stop and tell the user.
- If Spades step 4 landed first, its changes (4-name support, spades storage key, ContinueGameCard behaviour for 4 columns, reuse verdict) already exist — add Hearts alongside, don't redo them.
- Hearts rules page already exists (`src/games/rules/hearts.ts`, registered in `rules/index.ts`). `rules.test.ts` requires sections titled exactly `Goal` and `Winning the game` and at least one section with `scoring` rows for every registry game, plus per-game sync checks (see the gin/cribbage ones).
- Registry entry `hearts` currently has `route: '/hearts'`, `playerCount: 4`, `available: false`.
- Store API (step 3): `useHeartsStore.getState().clear()`, `selectHasSavedGame`, `currentGame` shape `HeartsGame`.

## Goal
Everything that must exist before building Hearts screens, without making Hearts playable (it stays `available: false`; nothing may link to a missing route).

## Tasks
1. Rules page `src/games/rules/hearts.ts`: keep the existing content but make it match the engine — **pull 50/100/150 targets and the 1/13/26 point constants from engine config** so rules and engine cannot drift. Fix/expand: the 4-hand pass cycle (left, right, across, hold) wording; both shoot-the-moon variants (default "others +26", option "shooter −26") described as an app setting; the **tie-for-lowest rule** (play on until the lowest is unique); a "Using Card Keeper" section (enter hearts each player took + who took the queen of spades, "Shot the moon" shortcut, edit/undo, dealer rotation and pass direction hints). Keep `Goal` and `Winning the game` titles. Add a hearts sync test to `rules.test.ts` like the gin/cribbage ones (e.g. an engine worked example matches a documented example).
2. Registry: set the `hearts` route to `/hearts/setup`; refine the description if helpful ("Lowest score wins. Track hearts, the queen and shooting the moon."). Keep `available: false`; keep `registry.test.ts` and `grid.test.ts` green.
3. Saved games: add hearts to the saved-games builder (title "Hearts", continue route `/hearts/scoreboard`, discard → `useHeartsStore.getState().abandonGame()`), passing four player names and `selectTotals`. **Generalise `ContinueGameCard` to 4 players** if not already done (a 2×2 grid of name + total, or a compact row that wraps; no visual change for 2–3 players; must survive font scale 1.5 and 320dp). Update accessibility label (all four names/totals). Unit-test the hearts path of the builder (it never shows until step 8 flips availability — still wire and test it).
4. Name helpers: allow 4 names with a hearts storage key `card-keeper/hearts/last-names` (extend the list helpers rather than adding new ones; existing gin/cribbage/spades behaviour and tests unchanged). Make sure `validateNameList` reports duplicate names (case-insensitive) on the later field for 4 names.
5. `_layout.tsx`: ErrorBoundary `onReset` also clears the hearts store. (Stack screen options for hearts routes are added in steps 7 and 9.)
6. Check `ScorePanel`, `HandHistory`, `GameMenu`, `WinnerBanner`, `ScoreBreakdown` and decide which are generic enough for Hearts (4 individual-player panels; a 4-column points history; a ranked 4-player result). Record the verdict + any small generalisations (props, no visual change for the other games) in the Handoff so steps 6–9 know what to reuse vs build. Prefer reusing whatever Spades already generalised.
7. Do **not** touch the README "playable" sentence (step 8/10).

## Acceptance criteria
- Hearts shows as "coming soon" with an accurate Rules page; other games unchanged visually and behaviourally.
- No reachable references to missing routes.
- New pure helpers have tests; existing tests only changed for generalised signatures.

## Verify
`npm run lint && npm run typecheck && npm test`

## Handoff (fill in when done)
- Files created/changed:
- Final signatures (saved-games builder, `ContinueGameCard` with 4 players, name helpers):
- Reuse verdict for `ScorePanel` / `HandHistory` / `GameMenu` / `WinnerBanner` / `ScoreBreakdown`:
- Gotchas:
- Updates made to later step plans:

**Before ending:** update `hearts-step-05.md`, `hearts-step-06.md`, `hearts-step-08.md`, `hearts-step-09.md` with real signatures and the reuse verdict; commit `Hearts step 4: rules, registry, shared UI`.
