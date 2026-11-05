# Hearts — overview and step index

Read this file first in **every** step session, then the step's own `hearts-step-NN.md`.

## Goal
Add Hearts to Card Keeper (Expo SDK 58 / React Native / Expo Router / zustand). Like Gin Rummy, Cribbage and Spades it is a **score keeper** (no card play): after each hand the players enter how many hearts each player took and who took the queen of spades, and the app scores the hand, tracks totals, handles shooting the moon, and detects the winner. **Lowest score wins.**

## Confirmed decisions (assumptions — flag to the user if any is wrong)
- Always **4 players, every player for themselves** (no teams). Seating order is player 0, 1, 2, 3 clockwise. Registry `playerCount` stays `4`; 3- and 5-player Hearts are out of scope.
- **Hand entry is per player**: hearts taken (0–13, four values summing to 13) plus **who took the queen of spades**. The app derives points (`hearts + 13 if queen`), so a hand can never total anything but 26 (or the moon equivalent). A "Shot the moon" shortcut sets 13 hearts + the queen for one player.
- **Shooting the moon** (one player takes all 13 hearts *and* the queen) is detected automatically. Setup option, default **"Others +26"** (shooter scores 0, every other player +26); alternative **"Shooter −26"** (shooter scores −26, others 0). Totals may therefore go negative.
- **Target** selectable at setup: **100** (default, standard), **50** (short), **150** (long).
- **Game end** (checked after every hand): once any player's total is **≥ target**, the game ends and the **lowest total wins** — *unless* the lowest total is tied, in which case play continues until the lowest is unique (standard tie-break). Hands after the deciding hand are dropped when hands are rebuilt after an edit.
- **Pass direction** cycles by hand number (derived, informational only): hand 1 left, 2 right, 3 across, 4 hold, then repeat. Shown on the scoreboard and hand-entry screens.
- **Dealer** rotates clockwise every hand: dealer of hand `h` (1-based) = `(firstDealer + h − 1) % 4`; derived from `hands.length + 1` (no separate action).
- Hands can be edited (tap in history) and the last hand undone. Totals are always **recomputed from the hand list**, never stored incrementally.
- Out of scope (note as future config flags only): Jack of Diamonds −10 ("omnibus"), "exactly 100 resets to 50", Ten of Clubs doubling, per-player-count variants, tracking individual tricks/cards.

## Rules the engine implements
Per hand, with `hearts[p]` and `queen` (the player who took the Q♠):
- `raw[p] = hearts[p] + (queen === p ? 13 : 0)`; always sums to 26.
- **Moon** iff some player `s` has `hearts[s] === 13 && queen === s`. `othersAdd`: `points[s] = 0`, every other `+26`. `shooterSubtracts`: `points[s] = −26`, others `0`.
- Totals = running sum of `points`. `getOutcome(totals, config)`: over iff `max(totals) ≥ target` **and** the minimum total is held by exactly one player; the winner is that player. A tie for lowest while someone is over target ⇒ not over (keep playing).
- Config: `getConfig(target, moonRule)` ⇒ `{ target, moonRule, heartPoints: 1, queenPoints: 13, handPoints: 26 }`.

## Existing patterns to mirror
| Layer | Reference |
|---|---|
| Engine | `src/games/ginRummy/engine/*`, `src/games/cribbage/engine/*` (types/config/scoring/game/index + tests) |
| Store | `src/games/ginRummy/store/*`, `src/games/cribbage/store/*` (zustand + persist + sanitize, `ActionResult`, memoised selectors) |
| Screens | `src/app/gin/{setup,scoreboard,hand,game-over}.tsx` |
| Feature UI | `src/features/{scoreboard,handEntry,gameOver,setup,home}/*` |
| Registry / rules | `src/games/registry.ts`, `src/games/rules/*` (a hearts rules page already exists and is registered) |
| Root layout / ErrorBoundary | `src/app/_layout.tsx` |
| Docs on adding a game | `README.md` ("Adding a new game") |
| Sibling plans — read their **Handoff** sections for gotchas | `docs/cribbage/plan.md` (+ step files), `docs/spades/spades-plan.md` (+ step files). Spades is the closest (4 players, per-hand entry, same screens); Hearts differs in having **no teams, no bids/drafts, no bags, lowest-wins**. |

## Shared contracts (steps may refine; **the step that builds a thing is the source of truth — it must record the real API in its Handoff section and patch later step files that assumed otherwise**)

### Engine — `@/games/hearts/engine`
```ts
type PlayerIndex = 0 | 1 | 2 | 3;
type MoonRule = 'othersAdd' | 'shooterSubtracts';
type PassDirection = 'left' | 'right' | 'across' | 'hold';
interface HeartsConfig { target: 50 | 100 | 150; moonRule: MoonRule; heartPoints: number; queenPoints: number; handPoints: number }
interface GameContext { firstDealer: PlayerIndex; config: HeartsConfig }
interface HandInput { hearts: readonly [number, number, number, number]; queen: PlayerIndex }
interface HandRecord { id: string; number: number /* 1-based */; input: HandInput }
class InvalidHandError extends Error { errors: string[] }

CONSTANTS: PLAYER_COUNT = 4, HEARTS_PER_HAND = 13, QUEEN_POINTS = 13, HAND_POINTS = 26
getConfig(target, moonRule): HeartsConfig;  TARGET_OPTIONS; MOON_RULE_OPTIONS (value + label + caption)
dealerOf(handNumber, firstDealer): PlayerIndex;  passDirectionOf(handNumber): PassDirection;  PASS_LABELS
validateHand(input, config): string[]                       // collects all errors (ERROR_* constants)
scoreHand(input, config): { raw: [n,n,n,n]; points: [n,n,n,n]; shooter: PlayerIndex | null }
createHandRecord(id, number, input, config): HandRecord     // throws InvalidHandError
rebuildHands(entries: {id, input}[], ctx): HandRecord[]     // renumber, truncate after the deciding hand
computeHandResults(hands, ctx): HandResult[]                // per hand: dealer, pass, raw, points, shooter, totalsAfter
computeTotals(hands, ctx): [n,n,n,n]
getOutcome(totals, config): { over: boolean; winner: PlayerIndex | null }
isGameOver(hands, ctx): boolean
computeResult(hands, ctx): { winner: PlayerIndex | null; ranking: { player; total; rank }[]; totals; margin; handsPlayed; stats: PlayerStats[4] }
// PlayerStats = { moons, queens, heartsTaken, cleanHands /* 0-point hands */, bestHand, worstHand }
```

### Store — `@/games/hearts/store`
```ts
interface HeartsGame { id; startedAt; players: [string, string, string, string]; target: 50 | 100 | 150; moonRule: MoonRule; firstDealer: PlayerIndex; hands: HandRecord[]; status: 'inProgress' | 'finished' }
actions: startGame({ names, target, moonRule, firstDealer }), addHand(input), updateHand(id, input), undoLastHand(), finishGame(), abandonGame(), clear()   // all but abandonGame/clear return ActionResult
hooks/selectors: useHeartsStore, useHeartsHydrated, selectContext, selectHandResults, selectTotals, selectDealer, selectHandNumber, selectPassDirection, selectResult, selectIsGameOver, selectHasSavedGame
storage key 'card-keeper/hearts', version 1, history max 20 (newest first, finished games only)
```

### Routes
`/hearts/setup` -> `/hearts/scoreboard` (main) -> `/hearts/hand` (modal; `?handId=` to edit) ; finished -> `/hearts/game-over`.

## Step index (run in order; each is sized for one chat session)
| # | File | Builds | Depends on |
|---|---|---|---|
| 1 | [hearts-step-01.md](./hearts-step-01.md) | types, config, validation, single-hand scoring, dealer/pass helpers + tests | — |
| 2 | [hearts-step-02.md](./hearts-step-02.md) | game aggregation: rebuild, totals, outcome/tie rule, result + stats + tests | 1 |
| 3 | [hearts-step-03.md](./hearts-step-03.md) | persisted zustand store, selectors, hydration + tests | 1, 2 |
| 4 | [hearts-step-04.md](./hearts-step-04.md) | rules refresh, registry route, shared UI generalised to 4 players | 1–3, **cribbage step 4** |
| 5 | [hearts-step-05.md](./hearts-step-05.md) | `/hearts/setup` | 3, 4 |
| 6 | [hearts-step-06.md](./hearts-step-06.md) | scoreboard components + history builder (no screen yet) | 2, 3, 4 |
| 7 | [hearts-step-07.md](./hearts-step-07.md) | hand-entry helpers/components + `/hearts/hand` modal | 2, 3 |
| 8 | [hearts-step-08.md](./hearts-step-08.md) | `/hearts/scoreboard` screen, menu, home "continue", flips `available: true` | 3–7 |
| 9 | [hearts-step-09.md](./hearts-step-09.md) | summary builder + `/hearts/game-over` | 2, 3, 8 |
| 10 | [hearts-step-10.md](./hearts-step-10.md) | full verification, emulator QA, docs, version bump | all |

Steps 1–3 are pure logic with no dependency on cribbage/spades UI work and can start immediately. **Step 4 must not start until cribbage step 4 is committed** (it extends the same shared files: saved-games builder, `ContinueGameCard`, `NameField`, name helpers, `_layout.tsx`). **If Spades work has landed, read its Handoffs first** (`docs/spades/spades-step-04.md` onward): reuse its 4-name helpers, `NameField` usage, `ContinueGameCard` layout for 4 entries, and the reuse verdict for `ScorePanel`/`HandHistory`/`GameMenu`/`WinnerBanner` instead of re-deciding. Merge-sensitive files: `registry.ts`, `rules/index.ts`, `_layout.tsx`, `src/app/index.tsx`, `README.md`, `src/features/home/*` — re-read them fresh at the start of each step.

## Session protocol (applies to every step)
1. Read this overview, your step file, and the **Handoff** sections of every earlier hearts step (they list the *actual* APIs and gotchas). Check `git log` / `git status` for what cribbage/spades work landed in between.
2. Before touching Expo/RN APIs, check docs for SDK 58 (`https://docs.expo.dev/versions/v58.0.0/`, `https://docs.expo.dev/llms.txt`); do not rely on memory. No new dependencies are expected for Hearts; if one is needed use `npx expo install <pkg>`.
3. Follow existing conventions: pure logic in `src/games/...` and `src/features/...` with Jest tests beside the code; screens thin; path alias `@/`; theme tokens from `@/theme` (no hard-coded colours); `ScreenContainer`, `Button`, `Card`, `SegmentedControl`, `useResponsive`, `useTextScale`; 48dp minimum touch targets; accessibility labels; `maxFontSizeMultiplier` where layouts are tight. Zustand v5 selectors must return stable references (memoise derived arrays with a `WeakMap` keyed by the source array). Typed routes are off: navigate to not-yet-existing routes with `router.replace('/hearts/... ' as never)`.
4. Definition of done for a step: its acceptance criteria pass **and** `npm run lint && npm run typecheck && npm test` are green.
5. **Finish by filling in the step's Handoff section** and updating the *next* step's file ("Context from previous steps") with anything that differs from the contract above. Then commit: `Hearts step N: <summary>` (include the standard `Co-authored-by: Copilot` trailer).
6. Do not start the next step in the same session; stop and report.
