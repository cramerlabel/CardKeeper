# Step 4 — Rules page, registry entry, shared UI generalisation

Read [../plan.md](../plan.md) first, then the Handoffs of steps [1](../step-01-engine/plan.md) and [2](../step-02-store/plan.md).

## Context from previous steps
- Engine config constants (121/91/61, short game) and the store hooks (`useCribbageStore`, `useCribbageHydrated`, selectors) exist.
- Rules pages: `src/games/rules/{types,index,ginRummy}.ts`, rendered by `src/app/rules/[gameId].tsx`; `rules.test.ts` requires sections titled exactly `Goal` and `Winning the game` and at least one section with `scoring` rows for **every registry game**.
- Home screen (`src/app/index.tsx`) and `ContinueGameCard` currently hard-wire gin and exactly 2 players.
- `src/features/setup/playerNames.ts` and `NameField` (inside `src/app/gin/setup.tsx`) are 2-player/gin-specific.
- `src/app/_layout.tsx` ErrorBoundary only clears the gin store.

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

## Handoff (fill in when done)
- Files created/changed:
- Final signatures of `ContinueGameCard`, saved-games builder, name helpers, `NameField`:
- Icon chosen:
- Gotchas:
- Updates made to later step plans:

**Before ending:** update `step-05-setup-screen/plan.md` and `step-08-board-screen/plan.md` with real signatures; commit `Cribbage step 4: rules, registry, shared UI`.
