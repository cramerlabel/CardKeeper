# Cribbage — overview and step index

Read this file first in **every** step session, then the step's own `plan.md`.

## Goal
Add Cribbage to Card Keeper (Expo SDK 58 / React Native / Expo Router / zustand). Like Gin Rummy it is a **score keeper** (no card play): players enter points as they are scored. Additionally the score is shown on a **traditional continuous (racetrack) cribbage board** with front and back pegs per player.

## Confirmed decisions
- 2 or 3 players, chosen at setup.
- Score entry **per scoring event**: tap a player -> enter points -> choose kind (`pegging` | `hand` | `crib` | `heels` | `other`). Every event is logged in a history list; events can be edited, deleted, and the last one undone.
- Board: continuous oval/"racetrack" board, one concentric lane per player, 121 holes per lane (start + 120 + game hole), holes grouped in fives. Pegs: front + back peg per player (leapfrog), animated movement along the track.
- Skunk line (91) and double-skunk line (61) drawn on the board; skunk result at game over.
- Dealer tracking + crib indicator; dealer rotates each deal.
- Target 121 (standard) or 61 (short game). Short game skunk line = 31, no double skunk (assumption — call out if wrong).
- `react-native-svg` is used to draw the board (installed with `npx expo install react-native-svg`; native => dev/release build must be rebuilt).

## Rules the engine implements
- Game ends the instant a player reaches the target. Totals are capped at the target for display; later events are dropped when events are rebuilt after an edit.
- Valid event: integer points 1–29; player in range; `heels` is exactly 2 points and must belong to the current dealer; `crib` must belong to the current dealer.
- Skunk: loser finished below the skunk line (91 / 31). Double skunk: below 61 (121 game only). Each losing player is evaluated separately (3-player).
- Dealer of deal `d` (1-based) = `(firstDealer + d - 1) % playerCount`.
- Peg positions: `front` = player's total; `back` = player's total before their most recent event (0 = start, off-board). Position `target` = game hole.

## Existing patterns to mirror (Gin Rummy)
| Layer | Gin file(s) |
|---|---|
| Engine | `src/games/ginRummy/engine/*` |
| Store (zustand + persist + sanitize) | `src/games/ginRummy/store/*` |
| Screens | `src/app/gin/{setup,scoreboard,hand,game-over}.tsx` |
| Feature UI | `src/features/{scoreboard,handEntry,gameOver,setup,home}/*` |
| Registry / rules | `src/games/registry.ts`, `src/games/rules/*` |
| Root layout / ErrorBoundary | `src/app/_layout.tsx` |
| Docs on adding a game | `README.md` ("Adding a new game") |

## Shared contracts (steps may refine; **the step that builds a thing is the source of truth — it must record the real API in its Handoff section and patch later step files that assumed otherwise**)

### Engine — `@/games/cribbage/engine`
```ts
type PlayerCount = 2 | 3;
type PlayerIndex = 0 | 1 | 2;
type ScoreKind = 'pegging' | 'hand' | 'crib' | 'heels' | 'other';
interface CribbageConfig { target: number; skunkLine: number; doubleSkunkLine: number | null }
interface GameContext { playerCount: PlayerCount; firstDealer: PlayerIndex; config: CribbageConfig }
interface ScoreInput { player: PlayerIndex; kind: ScoreKind; points: number; deal: number }
interface ScoreEvent extends ScoreInput { id: string; number: number } // number = 1-based order
class InvalidScoreError extends Error { errors: string[] }
STANDARD_CONFIG (121/91/61), SHORT_CONFIG (61/31/null), getConfig(target: 121 | 61)
dealerOf(deal, firstDealer, playerCount): PlayerIndex
validateScore(input, ctx): string[]
createScoreEvent(id, number, input, ctx): ScoreEvent        // throws InvalidScoreError
rebuildEvents(entries: {id, input}[], ctx): ScoreEvent[]     // renumber, truncate after win
computeTotals(events, ctx): number[]                          // capped at target, length = playerCount
isGameOver(events, ctx): boolean
computeResult(events, ctx): { winner: PlayerIndex | null; totals: number[]; skunk: ('none'|'skunk'|'doubleSkunk')[]; margin: number }
pegPositions(events, ctx): { front: number; back: number }[]
```

### Store — `@/games/cribbage/store`
```ts
interface CribbageGame { id; startedAt; players: string[]; target: 121 | 61; firstDealer: PlayerIndex; deal: number; events: ScoreEvent[]; status: 'inProgress' | 'finished' }
actions: startGame({ names, target, firstDealer }), addScore(input), updateScore(id, input), deleteScore(id), undoLastScore(), nextDeal(), finishGame(), abandonGame(), clear()   // add/update/delete/undo return ActionResult
hooks/selectors: useCribbageStore, useCribbageHydrated, selectTotals, selectPegs, selectDealer, selectResult, selectIsGameOver, selectHasSavedGame, selectContext
storage key 'card-keeper/cribbage', version 1, history max 20 (newest first, finished games only)
```

### Routes
`/cribbage/setup` -> `/cribbage/board` (main) -> `/cribbage/score?eventId=` (modal) ; finished -> `/cribbage/game-over`.

## Step index (run in order; each is sized for one chat session)
| # | Folder | Builds | Depends on |
|---|---|---|---|
| 1 | [step-01-engine](./step-01-engine/plan.md) | `react-native-svg` dependency + pure scoring engine + tests | — |
| 2 | [step-02-store](./step-02-store/plan.md) | persisted zustand store, selectors, hydration hook + tests | 1 |
| 3 | [step-03-board-geometry](./step-03-board-geometry/plan.md) | pure racetrack board geometry + tests | 1 (config only) |
| 4 | [step-04-rules-and-shared-ui](./step-04-rules-and-shared-ui/plan.md) | rules page, registry entry (still `available: false`), shared UI generalisation | 1, 2 |
| 5 | [step-05-setup-screen](./step-05-setup-screen/plan.md) | `/cribbage/setup` | 2, 4 |
| 6 | [step-06-board-component](./step-06-board-component/plan.md) | SVG `CribbageBoard` + animated pegs | 3 |
| 7 | [step-07-score-entry](./step-07-score-entry/plan.md) | `/cribbage/score` modal + entry helpers | 2 |
| 8 | [step-08-board-screen](./step-08-board-screen/plan.md) | `/cribbage/board` screen, history, menu, home "continue", flips `available: true` | 2, 4–7 |
| 9 | [step-09-game-over](./step-09-game-over/plan.md) | summary builder + `/cribbage/game-over` | 2, 6, 8 |
| 10 | [step-10-qa-and-release](./step-10-qa-and-release/plan.md) | full verification, emulator QA, docs, version bump | all |

## Session protocol (applies to every step)
1. Read this overview, your step's `plan.md`, and the **Handoff** sections of every earlier step (they list the *actual* APIs and gotchas).
2. Before touching Expo/RN APIs, check docs for SDK 58 (`https://docs.expo.dev/versions/v58.0.0/`, `https://docs.expo.dev/llms.txt`); do not rely on memory. Use `npx expo install <pkg>` for dependencies.
3. Follow Gin Rummy conventions: pure logic in `src/games/...` and `src/features/...` with Jest tests beside the code; screens thin; path alias `@/`; theme tokens from `@/theme` (no hard-coded colours); `ScreenContainer`, `Button`, `Card`, `SegmentedControl`, `useResponsive`, `useTextScale` where applicable; 48dp minimum touch targets; accessibility labels; `maxFontSizeMultiplier` where layouts are tight.
4. Definition of done for a step: its acceptance criteria pass **and** `npm run lint && npm run typecheck && npm test` are green.
5. **Finish by filling in the step's Handoff section** and updating the *next* step's `plan.md` ("Context from previous steps") with anything that differs from the contract above. Then commit: `Cribbage step N: <summary>` (include the standard `Co-authored-by: Copilot` trailer).
6. Do not start the next step in the same session; stop and report.
