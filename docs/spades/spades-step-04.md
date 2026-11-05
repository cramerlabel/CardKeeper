# Step 4 — Rules refresh, registry route, shared UI for 4 players / teams

Read [spades-plan.md](./spades-plan.md) first, then the Handoffs of steps [1](./spades-step-01.md)–[3](./spades-step-03.md) **and the Handoff of cribbage step 4** (`docs/cribbage/step-04-rules-and-shared-ui/plan.md`).

## Context from previous steps
- **Prerequisite:** cribbage step 4 is committed. It generalised `ContinueGameCard` (`players`/`totals` arrays), added a saved-games builder (`src/features/home/savedGames.ts`), list-based name helpers (`validateNameList`, `loadLastNames(storage, key)`), `NameField` (`src/features/setup/NameField.tsx`) and the cribbage `clear()` call in the `_layout.tsx` ErrorBoundary. If any of that is missing or named differently, read the cribbage Handoff and the current code first; **extend those helpers, do not duplicate them**. If cribbage step 4 is genuinely not done, stop and tell the user.
- Spades rules page already exists (`src/games/rules/spades.ts`, registered in `rules/index.ts`). `rules.test.ts` requires sections titled exactly `Goal` and `Winning the game` and at least one section with `scoring` rows for every registry game, plus per-game sync checks (see the gin and cribbage ones).
- Registry entry `spades` currently has `route: '/spades'`, `playerCount: 4`, `available: false`.
- Store API (step 3): `useSpadesStore.getState().clear()`, `selectHasSavedGame`, `currentGame` shape `SpadesGame`.

## Goal
Everything that must exist before building Spades screens, without making Spades playable (it stays `available: false`; nothing may link to a missing route).

## Tasks
1. Rules page `src/games/rules/spades.ts`: keep the existing content but make it match the engine — **pull 500/300/200, floors, 10-point/1-point/100-point constants from engine config** so rules and engine cannot drift; add Nil vs Blind Nil (±200), the nil-tricks-become-bags note, the 10-bag penalty wording, tie/both-over rule, and a "Using Card Keeper" section (enter each player's bid and tricks, bids can be saved before play, edit/undo, dealer rotation). Keep `Goal` and `Winning the game` titles. Add a spades sync test to `rules.test.ts` like the gin/cribbage ones (e.g. engine example from step 1 matches a documented example).
2. Registry: set the `spades` route to `/spades/setup`; update the description if helpful ("Partnership bidding score keeper with nil and bags."). Keep `available: false`; keep `registry.test.ts` and `grid.test.ts` green.
3. Saved games: add spades to the saved-games builder (title "Spades", continue route `/spades/scoreboard`, discard → `useSpadesStore.getState().abandonGame()`); for the card pass two **team** columns (`players = [teamLabel0, teamLabel1]`, `totals = selectTotals`) so the existing card works unchanged. Add a pure `teamLabel(names, team)` helper (e.g. in `src/games/spades/teams` or `src/features/setup`) + tests: "Alice & Carol", and a fallback for blank names. Unit test the spades path of the builder (it never shows until step 8 flips availability — still wire and test it).
4. Name helpers: allow 4 names with a spades storage key `card-keeper/spades/last-names` (extend the list helpers rather than adding new ones; existing gin/cribbage behaviour and tests unchanged).
5. `_layout.tsx`: ErrorBoundary `onReset` also clears the spades store. (Stack screen options for spades routes are added in steps 7 and 9.)
6. Check `ScorePanel`, `HandHistory`, `GameMenu`, `WinnerBanner`, `ScoreBreakdown` and decide which are generic enough for spades (2 team panels). Record the verdict + any small generalisations (props, no visual change for gin/cribbage) in the Handoff so steps 6–9 know what to reuse vs build.
7. Do **not** touch the README "playable" sentence (step 8/10).

## Acceptance criteria
- Spades shows as "coming soon" with an accurate Rules page; gin (and cribbage, if live) unchanged visually and behaviourally.
- No reachable references to missing routes.
- New pure helpers have tests; existing tests only changed for generalised signatures.

## Verify
`npm run lint && npm run typecheck && npm test`

## Handoff (fill in when done)
- Files created/changed:
- Final signatures (saved-games builder, `ContinueGameCard` usage for teams, name helpers, `teamLabel`):
- Reuse verdict for `ScorePanel` / `HandHistory` / `GameMenu` / `WinnerBanner` / `ScoreBreakdown`:
- Gotchas:
- Updates made to later step plans:

**Before ending:** update `spades-step-05.md`, `spades-step-06.md`, `spades-step-08.md` with real signatures and the reuse verdict; commit `Spades step 4: rules, registry, shared UI`.
