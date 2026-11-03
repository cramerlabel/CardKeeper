export interface ScoreRow {
  label: string;
  value: string;
}

export interface RulesSection {
  title: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
  /** Label / points rows rendered as a compact table. */
  scoring?: readonly ScoreRow[];
}

export interface GameRules {
  /** One or two sentences: what the game is about and how it is won. */
  summary: string;
  /** Short facts shown as chips, e.g. '4 players'. */
  quickFacts: readonly string[];
  sections: readonly RulesSection[];
}
