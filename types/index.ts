// ── Odds API ─────────────────────────────────────────────────────────────────

export interface OddsOutcome {
  name: string;
  price: number;   // American odds
  point?: number;  // spread / total point
}

export interface OddsMarket {
  key: "h2h" | "spreads" | "totals";
  outcomes: OddsOutcome[];
}

export interface OddsBookmaker {
  key: string;
  title: string;
  markets: OddsMarket[];
}

export interface OddsGame {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
}

// ── ESPN Scores ───────────────────────────────────────────────────────────────

export interface TeamInfo {
  id?: string;
  name: string;
  abbreviation: string;
  logo: string;
  score: string | null;
  winner: boolean;
}

export interface GameStatus {
  state: "pre" | "in" | "post";
  description: string;
  clock: string;
  period: number;
}

export interface ScoreGame {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: GameStatus;
  home: TeamInfo;
  away: TeamInfo;
}

// ── Merged view model ─────────────────────────────────────────────────────────

export interface MergedGame {
  id: string;
  date: string;
  home: TeamInfo;
  away: TeamInfo;
  status: GameStatus;
  // pregame odds (best available from first bookmaker)
  spread: { favorite: string; points: number } | null;
  moneyline: { home: number; away: number } | null;
  // alert flag
  upsetAlert: boolean;
}
