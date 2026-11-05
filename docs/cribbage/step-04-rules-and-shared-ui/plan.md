# Step 4 — Rules page, registry entry, shared UI generalisation

Read [../plan.md](../plan.md) first, then the Handoffs of steps [1](../step-01-engine/plan.md) and [2](../step-02-store/plan.md).

## Context from previous steps
- Engine config constants (121/91/61, short game) and the store hooks (`useCribbageStore`, `useCribbageHydrated`, selectors) exist.
- Rules pages: `src/games/rules/{types,index,ginRummy}.ts`, rendered by `src/app/rules/[gameId].tsx`; `rules.test.ts` requires sections titled exactly `Goal` and `Winning the game` and at least one section with `scoring` rows for **every registry game**.
- Home screen (`src/app/index.tsx`) and `ContinueGameCard` currently hard-wire gin and exactly 2 players.
- `src/features/setup/playerNames.ts` and `NameField` (inside `src/app/gin/setup.tsx`) are 2-player/gin-specific.
- `src/app/_layout.tsx` ErrorBoundary only clears the gin store.
- Real store API (step 2): `useCribbageStore.getState().clear()` exists for the ErrorBoundary; `selectHasSavedGame(state)` is true only for an `inProgress` current game; `currentGame` shape is `CribbageGame` (`players: string[]`, `target`, `firstDealer`, `deal`, `events`, `status`). Import everything from `@/games/cribbage/store`.

## Goal
Everything that must exist before building cribbage screens, without making Cribbage playable yet (registry entry stays `available: false`, so the card shows "coming soon" + rules, and nothing links to missing routes).

## Tasks
1. `src/games/rules/cribbage.ts` (`GameRules`) and register under id `cribbage` in `rules/index.ts`. Sections: Goal; The deal & the crib; The play (pegging: 15 = 2, 31 = 2, go/last card = 1, pairs 2/6/12, runs of 3+); The show (fifteens 2, pairs 2, runs 1 per card, flush 4 or 5, nobs 1, his heels 2, max hand 29, crib flush needs 5); Skunks; **Winning the game** (first to 121, or 61 short game; peg on the board); Using Card Keeper (add points as you score; board; dealer/crib; undo). Include `scoring` tables. Pull the numbers 121/91/61/31 from engine config so rules and engine cannot drift. Extend `rules.test.ts` with a cribbage sync check like the gin one.
2. Registry: add `{ id: 'cribbage', name: 'Cribbage', description: 'Peg your points on a traditional board. 2–3 players.', route: '/cribbage/setup', icon: <valid MaterialCommunityIcons name>, playerCount: [2, 3], available: false }`. Keep `registry.test.ts` and `grid.test.ts` green. (Step 8 flips `available: true`.)
3. Generalise `ContinueGameCard`: `players: readonly string[]`, `totals: readonly number[]` (2–3 columns, accessibility label built from all players), keep gin look unchanged for 2. Add/adjust tests if present.
4. Home screen: replace gin-only continue logic with a small list of "saved games" built from both stores (gin now, cribbage when `selectHasSavedGame`), each with its own continue route (`/gin/scoreboard`, `/cribbage/board`) and discard action. Because cribbage is not yet available, the cribbage card simply never appears until step 8 — still wire it and unit test the pure builder (e.g. `src/features/home/savedGames.ts` + test).
5. Name helpers: add list-based helpers beside the existing ones (`validateNameList`, `loadLastNames(storage, key)`/`saveLastNames` variants or an optional key parameter) for 2–3 players with a cribbage storage key `card-keeper/cribbage/last-names`. Existing gin exports/tests must remain green and unchanged in behaviour.
6. Extract `NameField` from `src/app/gin/setup.tsx` into `src/features/setup/NameField.tsx` (no visual change) and use it from gin setup.
7. `_layout.tsx`: ErrorBoundary `onReset` also calls `useCribbageStore.getState().clear()`. (Stack screen options for cribbage routes are added in steps 7 and 9.)
8. README: add Cribbage to the "playable / coming soon" sentence only in step 8/10 (not now).

## Acceptance criteria
- Cribbage appears in the home grid as "coming soon" with a working Rules page; gin flow visually and behaviourally unchanged.
- No references to non-existent routes are reachable.
- New pure helpers have tests; existing tests untouched or updated only for the generalised signatures.

## Verify
`npm run lint && npm run typecheck && npm test`

## Handoff
- Files created: `src/games/rules/cribbage.ts` (numbers from `STANDARD_CONFIG`/`SHORT_CONFIG`/`HEELS_POINTS`/`MAX_EVENT_POINTS`), `src/features/home/savedGames.ts` (+ test), `src/features/setup/NameField.tsx`. Changed: `rules/index.ts`, `rules.test.ts` (cribbage sync check), `registry.ts`, `ContinueGameCard.tsx`, `src/app/index.tsx`, `src/app/gin/setup.tsx`, `src/app/_layout.tsx`, `features/setup/playerNames.ts` (+ test).
- Final signatures:
  - `ContinueGameCard({ gameName, players: readonly string[], totals: readonly number[], progressLabel: string, onContinue, onDiscard })` — `handCount` was replaced by a ready-made `progressLabel`; "vs" is shown only for 2 players; the discard alert and accessibility label list all players.
  - `src/features/home/savedGames.ts`: `buildSavedGames({ ginRummy: { players, totals, handCount } | null, cribbage: { players, totals, deal } | null }): SavedGameSummary[]` (`{ gameId: 'ginRummy' | 'cribbage', gameName, players, totals, progressLabel, continueRoute }`, gin first; cribbage label is `Deal N`, route `/cribbage/board`), `formatNameList(names)`, type `SavedGameId`. The home screen passes `null` until the store is hydrated and only for `selectHasSavedGame` games, and maps `gameId` to the discard action (`abandonGame`).
  - `playerNames.ts` additions (gin exports unchanged; `defaultName`/`effectiveName` now take `index: number`): `CRIBBAGE_NAMES_STORAGE_KEY` (`'card-keeper/cribbage/last-names'`), `MIN_LIST_PLAYERS`/`MAX_LIST_PLAYERS` (2/3), `validateNameList(raw: readonly string[]) => { valid, errors: (string | null)[], names: string[] }` (a name is flagged when an earlier field has it), `loadLastNameList(storage, key): Promise<string[] | null>` (2–3 strings only), `saveLastNameList(names, storage, key)`.
  - `NameField` (`@/features/setup/NameField`, named export): props `{ label, value, placeholder, error, onChangeText, inputRef?, returnKeyType?, onSubmitEditing? }`; no visual change.
- Icon chosen: `scoreboard-outline`.
- Gotchas: cribbage stays `available: false` (registry test still expects only gin available), so the home cribbage "continue" card is wired but unreachable until step 8. `_layout.tsx` ErrorBoundary now clears both stores. The registry `description` for cribbage includes "2–3 players." as written in the plan.
- Updates made to later step plans: step 5 and step 8 "Context from previous steps" now list the real helper signatures.

**Before ending:** update `step-05-setup-screen/plan.md` and `step-08-board-screen/plan.md` with real signatures; commit `Cribbage step 4: rules, registry, shared UI`.
