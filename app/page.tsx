"use client";

import { useEffect, useState, useCallback } from "react";
import GameCard from "@/components/GameCard";
import type { MergedGame, ScoreGame, OddsGame } from "@/types";
import { mergeGames } from "@/lib/mergeGames";

const SCORE_REFRESH_MS = 60_000; // live score refresh interval

export default function Dashboard() {
  const [games, setGames] = useState<MergedGame[]>([]);
  const [odds, setOdds] = useState<OddsGame[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oddsError, setOddsError] = useState<string | null>(null);

  const fetchOdds = useCallback(async () => {
    try {
      const res = await fetch("/api/odds");
      const data = await res.json();
      if (Array.isArray(data)) {
        setOdds(data);
        setOddsError(null);
      } else {
        setOddsError("Odds unavailable — add your ODDS_API_KEY to .env.local");
      }
    } catch {
      setOddsError("Odds unavailable — add your ODDS_API_KEY to .env.local");
    }
  }, []);

  const fetchScores = useCallback(async (currentOdds: OddsGame[]) => {
    const res = await fetch("/api/scores");
    if (!res.ok) throw new Error(`Scores API error: ${res.status}`);
    const scores: ScoreGame[] = await res.json();
    if (!Array.isArray(scores)) throw new Error("Unexpected scores response");
    setGames(mergeGames(scores, currentOdds));
    setLastUpdated(new Date());
  }, []);

  // Initial load: fetch odds + scores together
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const oddsRes = await fetch("/api/odds");
        const oddsData = await oddsRes.json();
        const freshOdds: OddsGame[] = Array.isArray(oddsData) ? oddsData : [];
        if (!Array.isArray(oddsData)) {
          setOddsError("Odds unavailable — add your ODDS_API_KEY to .env.local");
        }
        setOdds(freshOdds);

        const scoresRes = await fetch("/api/scores");
        const scores: ScoreGame[] = await scoresRes.json();
        setGames(mergeGames(scores, freshOdds));
        setLastUpdated(new Date());
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Live score auto-refresh every 60s (re-uses cached odds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await fetchScores(odds);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Refresh failed");
      }
    }, SCORE_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchScores, odds]);

  const liveGames = games.filter((g) => g.status.state === "in");
  const upcomingGames = games.filter((g) => g.status.state === "pre");
  const finalGames = games.filter((g) => g.status.state === "post");
  const alertGames = games.filter((g) => g.upsetAlert);

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            🏀 Women&apos;s March Madness
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Betting Tracker</p>
        </div>
        <div className="text-right">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Scores updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={async () => {
              await fetchOdds();
              await fetchScores(odds);
            }}
            className="mt-1 text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Banners */}
        {oddsError && (
          <div className="bg-yellow-900/40 border border-yellow-700 rounded-lg px-4 py-3 text-sm text-yellow-300">
            ⚠️ {oddsError}
          </div>
        )}
        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
            ❌ {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-20 text-gray-500">Loading games…</div>
        )}

        {/* Upset alerts */}
        {alertGames.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
              🚨 Upset Alerts
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {alertGames.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {alertGames.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </div>
          </section>
        )}

        {/* Live games */}
        {liveGames.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              Live Games
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveGames
                .filter((g) => !g.upsetAlert)
                .map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
            </div>
          </section>
        )}

        {/* Upcoming games */}
        {upcomingGames.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-blue-400 mb-3">
              Upcoming Games
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingGames.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </div>
          </section>
        )}

        {/* Final games */}
        {finalGames.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-500 mb-3">Final</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
              {finalGames.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </div>
          </section>
        )}

        {!loading && games.length === 0 && !error && (
          <div className="text-center py-20 text-gray-500">
            No WNCAAB games found right now. Check back during the tournament!
          </div>
        )}
      </div>
    </main>
  );
}
