import type { OddsGame, ScoreGame, MergedGame } from "@/types";

const UPSET_SPREAD_THRESHOLD = 5; // favorite must be favored by ≥ 5 pts
const UPSET_LOSING_THRESHOLD = 5; // favorite must be losing by ≥ 5 pts

/**
 * Fuzzy-match team names between two APIs that use different naming conventions.
 * Returns true when the ESPN name likely represents the Odds API name.
 */
function nameMatch(espnName: string, oddsName: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
  const a = normalize(espnName);
  const b = normalize(oddsName);
  if (a === b) return true;
  // Check if the last word of each (usually the mascot) matches
  const aWords = a.split(" ");
  const bWords = b.split(" ");
  return aWords[aWords.length - 1] === bWords[bWords.length - 1];
}

export function mergeGames(
  scores: ScoreGame[],
  odds: OddsGame[]
): MergedGame[] {
  return scores.map((game) => {
    // Find matching odds game
    const oddsGame = odds.find(
      (o) =>
        (nameMatch(game.home.name, o.home_team) &&
          nameMatch(game.away.name, o.away_team)) ||
        (nameMatch(game.home.name, o.away_team) &&
          nameMatch(game.away.name, o.home_team))
    );

    let spread: MergedGame["spread"] = null;
    let moneyline: MergedGame["moneyline"] = null;

    if (oddsGame) {
      const bm = oddsGame.bookmakers[0]; // use first available bookmaker
      if (bm) {
        const spreadMarket = bm.markets.find((m) => m.key === "spreads");
        const h2hMarket = bm.markets.find((m) => m.key === "h2h");

        if (spreadMarket) {
          // negative point = favorite
          const fav = spreadMarket.outcomes.find(
            (o) => o.point !== undefined && o.point < 0
          );
          if (fav && fav.point !== undefined) {
            spread = { favorite: fav.name, points: Math.abs(fav.point) };
          }
        }

        if (h2hMarket) {
          const homeOdds = h2hMarket.outcomes.find(
            (o) => nameMatch(game.home.name, o.name) || o.name === oddsGame.home_team
          );
          const awayOdds = h2hMarket.outcomes.find(
            (o) => nameMatch(game.away.name, o.name) || o.name === oddsGame.away_team
          );
          if (homeOdds && awayOdds) {
            moneyline = { home: homeOdds.price, away: awayOdds.price };
          }
        }
      }
    }

    // Determine upset alert
    let upsetAlert = false;
    if (
      game.status.state === "in" &&
      spread &&
      spread.points >= UPSET_SPREAD_THRESHOLD &&
      game.home.score !== null &&
      game.away.score !== null
    ) {
      const homeScore = parseFloat(game.home.score);
      const awayScore = parseFloat(game.away.score);
      const favIsHome = nameMatch(game.home.name, spread.favorite);
      const favScore = favIsHome ? homeScore : awayScore;
      const dogScore = favIsHome ? awayScore : homeScore;
      if (dogScore - favScore >= UPSET_LOSING_THRESHOLD) {
        upsetAlert = true;
      }
    }

    return {
      id: game.id,
      date: game.date,
      home: game.home,
      away: game.away,
      status: game.status,
      spread,
      moneyline,
      upsetAlert,
    };
  });
}
