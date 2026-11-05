# Spades — overview and step index

Read this file first in **every** step session, then the step's own `spades-step-NN.md`.

## Goal
Add Spades to Card Keeper (Expo SDK 58 / React Native / Expo Router / zustand). Like Gin Rummy and Cribbage it is a **score keeper** (no card play): at the end of each hand the players enter every player's bid and tricks taken, and the app scores the hand for both partnerships, tracks bags, and detects the winner.

## Confirmed decisions
- Always 4 players in 2 fixed partnerships. Seating order is player 0, 1, 2, 3 clockwise; **partners sit across**: team 0 = players 0 & 2, team 1 = players 1 & 3. Team label is derived from the names ("Alice & Carol"); custom team names are out of scope.
- **Hand entry is per player**: bid (`Nil`, `Blind Nil`, or 1–13) plus tricks taken (0–13). The 4 tricks values must sum to 13.
- **Bids can be saved before play** as a draft (`draftBids`) so the scoreboard can show the current contracts during the hand; the full hand is scored after the last trick.
- Target selectable at setup: **500** (default, floor −200), **300** (floor −150), **200** (floor −100).
- **Blind Nil** (±200) is a setup toggle (default on). It is not restricted to teams that are behind (players police that themselves).
- Dealer rotates clockwise every hand: dealer of hand `h` (1-based) = `(firstDealer + h − 1) % 4`. Because each hand is one record there is no `nextDeal` action (unlike cribbage); the dealer is derived from `hands.length + 1`.
- Hands can be edited (tap in history) and the last hand undone. All later totals/bags are recomputed from the hand list, never stored incrementally.

## Rules the engine implements (assumptions flagged — call out if wrong)
Per team, per hand:
- **Contract bid** = sum of the `bid` values of the team's non-nil players. **Contract tricks** = tricks taken by the team's non-nil players only.
- Contract made (contract tricks ≥ bid): `+10 × bid`, plus **1 point per overtrick (bag)**. Missed: `−10 × bid`, no bags.
- **Nil** made (player took 0 tricks): `+100`; failed: `−100`. **Blind Nil**: `+200` / `−200`.
- **Tricks taken by a nil bidder never help the partner's contract**; they count as bags (1 point each, added to the bag count) — `nilTricksCountAsBags: true` in config (assumption; kept as a config flag). When both partners bid nil there is no contract; any tricks they take are bags.
- **Bags** accumulate across hands per team. Every 10 bags: `−100` and the bag count drops by 10 (loop if one hand crosses 10 twice).
- **Game end** (checked after each hand, both teams evaluated together):
  - a team `≥ target` wins; if both are `≥ target` the higher total wins; an exact tie means play another hand;
  - otherwise a team `≤ floor` loses (the other team wins);
  - if one team is `≥ target` and the other `≤ floor`, the `≥ target` team wins.
- Hands after the one that decides the game are dropped when hands are rebuilt after an edit.
- Config: `getConfig(target, blindNil)` => `{ target, floor, blindNilEnabled, pointsPerBid: 10, bagPoint: 1, bagLimit: 10, bagPenalty: 100, nilBonus: 100, blindNilBonus: 200, nilTricksCountAsBags: true }`.

## Existing patterns to mirror
| Layer | Reference |
|---|---|
| Engine | `src/games/ginRummy/engine/*`, `src/games/cribbage/engine/*` (types/config/scoring/game/index + tests) |
| Store | `src/games/ginRummy/store/*`, `src/games/cribbage/store/*` (zustand + persist + sanitize, `ActionResult`, memoised selectors) |
| Screens | `src/app/gin/{setup,scoreboard,hand,game-over}.tsx` |
| Feature UI | `src/features/{scoreboard,handEntry,gameOver,setup,home}/*` |
| Registry / rules | `src/games/registry.ts`, `src/games/rules/*` (a spades rules page already exists and is registered) |
| Root layout / ErrorBoundary | `src/app/_layout.tsx` |
| Docs on adding a game | `README.md` ("Adding a new game") |
| Sibling plan to learn from | `docs/cribbage/plan.md` and its step files — read their **Handoff** sections for gotchas |

## Shared contracts (steps may refine; **the step that builds a thing is the source of truth — it must record the real API in its Handoff section and patch later step files that assumed otherwise**)

### Engine — `@/games/spades/engine`
```ts
type PlayerIndex = 0 | 1 | 2 | 3;
type TeamIndex = 0 | 1;
type BidKind = 'bid' | 'nil' | 'blindNil';
interface PlayerHand { kind: BidKind; bid: number /* 1–13 for 'bid', 0 for nil kinds */; tricks: number /* 0–13 */ }
type HandInput = readonly [PlayerHand, PlayerHand, PlayerHand, PlayerHand]; // index = PlayerIndex
interface SpadesConfig { target: 500 | 300 | 200; floor: -200 | -150 | -100; blindNilEnabled: boolean; pointsPerBid; bagPoint; bagLimit; bagPenalty; nilBonus; blindNilBonus; nilTricksCountAsBags: boolean }
interface GameContext { firstDealer: PlayerIndex; config: SpadesConfig }
interface HandRecord { id: string; number: number /* 1-based */; input: HandInput }
class InvalidHandError extends Error { errors: string[] }

teamOf(p): TeamIndex; partnerOf(p): PlayerIndex; teamPlayers(t): [PlayerIndex, PlayerIndex]
getConfig(target, blindNil): SpadesConfig
dealerOf(handNumber, firstDealer): PlayerIndex
validateHand(input, config): string[]                    // collects all errors
scoreHand(input, config): [TeamHandScore, TeamHandScore] // pure single-hand score, before bag carry-over / penalty
createHandRecord(id, number, input, config): HandRecord  // throws InvalidHandError
rebuildHands(entries: {id, input}[], ctx): HandRecord[]  // renumber, truncate after the deciding hand
computeHandResults(hands, ctx): HandResult[]             // per hand: both teams' points, bag delta, penalty, running total + bags
computeTotals(hands, ctx): [number, number]
computeBags(hands, ctx): [number, number]                // bags carried (0–9)
isGameOver(hands, ctx): boolean
computeResult(hands, ctx): { winner: TeamIndex | null; reason: 'target' | 'floor' | null; totals; bags; margin; handsPlayed; nil: NilStats[4]; bagPenalties: [number, number] }
```
`TeamHandScore` = `{ team, contractBid, contractTricks, madeContract, bidPoints, bagsAdded, bagPoints, nilPoints, points }` (points exclude the bag penalty, which depends on carried bags and is added by `computeHandResults`).

### Store — `@/games/spades/store`
```ts
interface DraftBid { kind: BidKind; bid: number }
interface SpadesGame { id; startedAt; players: [string, string, string, string]; target: 500 | 300 | 200; blindNil: boolean; firstDealer: PlayerIndex; hands: HandRecord[]; draftBids: (DraftBid | null)[] | null; status: 'inProgress' | 'finished' }
actions: startGame({ names, target, blindNil, firstDealer }), saveDraftBids(bids | null), addHand(input), updateHand(id, input), undoLastHand(), finishGame(), abandonGame(), clear()   // all but abandonGame/clear return ActionResult
hooks/selectors: useSpadesStore, useSpadesHydrated, selectContext, selectHandResults, selectTotals, selectBags, selectDealer, selectHandNumber, selectResult, selectIsGameOver, selectHasSavedGame
storage key 'card-keeper/spades', version 1, history max 20 (newest first, finished games only)
```

### Routes
`/spades/setup` -> `/spades/scoreboard` (main) -> `/spades/hand` (modal; `?handId=` to edit) ; finished -> `/spades/game-over`.

## Step index (run in order; each is sized for one chat session)
| # | File | Builds | Depends on |
|---|---|---|---|
| 1 | [spades-step-01.md](./spades-step-01.md) | types, config, validation, single-hand scoring + tests | — |
| 2 | [spades-step-02.md](./spades-step-02.md) | game aggregation: rebuild, bags, totals, winner, stats + tests | 1 |
| 3 | [spades-step-03.md](./spades-step-03.md) | persisted zustand store, selectors, hydration + tests | 1, 2 |
| 4 | [spades-step-04.md](./spades-step-04.md) | rules refresh, registry route, shared UI generalised to 4 players/teams | 1–3, **cribbage step 4** |
| 5 | [spades-step-05.md](./spades-step-05.md) | `/spades/setup` | 3, 4 |
| 6 | [spades-step-06.md](./spades-step-06.md) | scoreboard components + history builder (no screen yet) | 2, 3 |
| 7 | [spades-step-07.md](./spades-step-07.md) | hand-entry helpers/components + `/spades/hand` modal | 2, 3 |
| 8 | [spades-step-08.md](./spades-step-08.md) | `/spades/scoreboard` screen, menu, home "continue", flips `available: true` | 3–7 |
| 9 | [spades-step-09.md](./spades-step-09.md) | summary builder + `/spades/game-over` | 2, 3, 8 |
| 10 | [spades-step-10.md](./spades-step-10.md) | full verification, emulator QA, docs, version bump | all |

Steps 1–3 are pure logic with no dependency on the cribbage work and can start immediately. **Step 4 must not start until cribbage step 4 is committed** (it builds on the same shared files: saved-games builder, `ContinueGameCard`, `NameField`, name helpers, `_layout.tsx`). If cribbage is further along, also read its later Handoffs for shared-UI changes. Merge-sensitive files: `registry.ts`, `rules/index.ts`, `_layout.tsx`, `src/app/index.tsx`, `README.md` — re-read them fresh at the start of each step.

## Session protocol (applies to every step)
1. Read this overview, your step file, and the **Handoff** sections of every earlier spades step (they list the *actual* APIs and gotchas). Check `git log` / `git status` for what cribbage work landed in between.
2. Before touching Expo/RN APIs, check docs for SDK 58 (`https://docs.expo.dev/versions/v58.0.0/`, `https://docs.expo.dev/llms.txt`); do not rely on memory. No new dependencies are expected for Spades; if one is needed use `npx expo install <pkg>`.
3. Follow existing conventions: pure logic in `src/games/...` and `src/features/...` with Jest tests beside the code; screens thin; path alias `@/`; theme tokens from `@/theme` (no hard-coded colours); `ScreenContainer`, `Button`, `Card`, `SegmentedControl`, `useResponsive`, `useTextScale`; 48dp minimum touch targets; accessibility labels; `maxFontSizeMultiplier` where layouts are tight. Zustand v5 selectors must return stable references (memoise derived arrays with a `WeakMap` keyed by the source array). Typed routes are off: navigate to not-yet-existing routes with `router.replace('/spades/... ' as never)`.
4. Definition of done for a step: its acceptance criteria pass **and** `npm run lint && npm run typecheck && npm test` are green.
5. **Finish by filling in the step's Handoff section** and updating the *next* step's file ("Context from previous steps") with anything that differs from the contract above. Then commit: `Spades step N: <summary>` (include the standard `Co-authored-by: Copilot` trailer).
6. Do not start the next step in the same session; stop and report.
