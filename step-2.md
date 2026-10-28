# Step 2 — Gin Rummy scoring engine (pure TypeScript)

## Context
See `step-0.md` for the authoritative rules. Step 1 produced the scaffold (Expo SDK 58, expo-router, TypeScript 6).
- TS: `strict: true`, path alias `@/*` → `src/*` (also mapped in Jest via `moduleNameMapper`), `types: ["jest"]`. Inside the engine prefer relative imports.
- Tests: Jest with `jest-expo` preset; colocate `*.test.ts` next to sources. Commands: `npm test` (add `-- --coverage` for coverage; `src/app` is excluded from coverage), `npm run typecheck`, `npm run lint` (ESLint + Prettier, `--max-warnings=0`), `npm run format`.
- Engine location: `src/games/ginRummy/engine/` (currently an empty folder with `.gitkeep`; delete the `.gitkeep`). Game registry is at `src/games/registry.ts`.

## Goal
A framework-free, fully unit-tested scoring engine at `src/games/ginRummy/engine/`. No React, no storage.

## Design
```ts
type PlayerId = 0 | 1;
type HandKind = 'knock' | 'gin' | 'bigGin';
type HandOutcome = 'knock' | 'undercut' | 'gin' | 'bigGin';

interface HandInput { knocker: PlayerId; kind: HandKind; deadwood: [number, number]; } // gin/bigGin: knocker deadwood = 0
interface HandResult { winner: PlayerId; points: number; outcome: HandOutcome; }
interface HandRecord extends HandResult { id: string; number: number; input: HandInput; }

interface ScoringConfig { ginBonus: 25; bigGinBonus: 31; undercutBonus: 25; gameBonus: 100; shutoutGameBonus: 200; boxBonus: 25; targetScore: 100; maxKnockDeadwood: 10; }

scoreHand(input, config?): HandResult           // throws/returns validation errors for invalid input
validateHandInput(input, config?): string[]     // errors: knock >10, gin with nonzero deadwood, negative, > max possible (e.g. 100), etc.
computeTotals(hands): [number, number]
handsWon(hands): [number, number]
isGameOver(totals, config): boolean
computeFinalScore(hands, config): { winner; raw:[n,n]; handsWon:[n,n]; boxBonus:[n,n]; gameBonus:[n,n]; shutout:boolean; final:[n,n] }
```
Rules: see `step-0.md`. Edge cases to define and test:
- Knock with equal deadwood → undercut. Undercut points = 25 + (knocker − opponent), awarded to the opponent, who is the hand winner.
- Gin: 25 + opponent deadwood (opponent deadwood may be 0 — still 25). Big gin: 31 + opponent deadwood.
- Knock with knocker deadwood 0 entered as "knock" should be flagged/treated as gin (decide; recommended: reject with message "use Gin").
- Both players ≥ 100 after the same hand — only the hand's winner can reach target in a single hand? (A player can only gain points on a hand, and only the hand's winner gains.) So only one player crosses; document this and test.
- Shutout = loser won 0 hands → winner's game bonus is 200 instead of 100.
- Final score winner = higher final total; box bonus applies to both players for hands won (including the winner).
- Winner by final score may differ from who crossed 100 only in exotic cases — document and test (the player who crossed 100 is the declared game winner; the game bonus goes to them).

## Tasks
1. Implement the module above with a `config.ts` containing defaults.
2. Unit tests (Jest) covering every rule plus the examples: knock 3 vs 9 → 6 to knocker; knock 8 vs 5 → undercut 25+3=28 to opponent; gin vs 12 → 37; big gin vs 12 → 43; shutout game; non-shutout game; validation errors.
3. Export a `GinRummyEngine` index with types for Step 3.

## Acceptance criteria
- `npm test` passes with high coverage of the engine (aim 100% lines).
- No imports from react/react-native in the engine folder.

## Handoff notes (fill in when done)
- DONE. Engine in `src/games/ginRummy/engine/` (`types.ts`, `config.ts`, `scoring.ts`, `game.ts`, `index.ts` + colocated tests; `.gitkeep` removed). 100% statement/branch/function/line coverage; typecheck, lint, tests pass (43 tests total). No react imports. Import via `@/games/ginRummy/engine`.
- API (all exported from `index.ts`):
  - `scoreHand(input, config?) → HandResult` (throws `InvalidHandError` with `.errors: string[]`), `validateHandInput(input, config?) → string[]`, `createHandRecord(id, number, input, config?) → HandRecord` (scores, validates, copies input).
  - `computeTotals(hands) → [n,n]`, `handsWon(hands) → [n,n]`, `isGameOver(totals, config?) → boolean`, `gameWinner(hands, config?) → PlayerId | null`, `computeFinalScore(hands, config?) → FinalScore`.
  - `DEFAULT_SCORING_CONFIG` (frozen). `ScoringConfig` has one extra field vs. the design: `maxDeadwood: 100` (max valid deadwood for either player).
  - `FinalScore = { winner: PlayerId | null; finalLeader: PlayerId | null; raw; handsWon; boxBonus; gameBonus; shutout; final }` (all pairs are `[number, number]`).
- Rule decisions:
  - Knock with knocker deadwood 0 is **rejected** ("A knock with 0 deadwood is a Gin. Use Gin."). Knock >10 rejected. Gin/big gin require knocker deadwood 0. Deadwood must be whole numbers 0–100 for both players. Opponent deadwood 0 is valid everywhere (gin vs 0 = 25, big gin vs 0 = 31, knock vs 0 = undercut 25 + knocker).
  - Equal deadwood on a knock = undercut (opponent is `winner`, points = 25 + diff).
  - Only a hand's winner gains points, so only one player can cross the target on any hand. `gameWinner` walks hands in order and returns whoever first reaches `targetScore` (null if nobody). That player is the declared winner and gets the game bonus (100, or 200 if the loser won 0 hands).
  - `finalLeader` is the player with the higher final total (null on tie); it can differ from `winner` in exotic cases (many box bonuses). Test covers it.
  - While the game isn't over: `winner = null`, `gameBonus = [0,0]`, `shutout = false`; box bonuses still computed. Callers should stop adding hands once `isGameOver` (hands after the crossing are still summed into `raw`).
- `step-3.md` updated.
