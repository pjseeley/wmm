"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import GameCard from "@/components/GameCard";
import type { MergedGame, ScoreGame, OddsGame } from "@/types";
import { mergeGames } from "@/lib/mergeGames";

const SCORE_REFRESH_MS = 60_000;
const ODDS_CACHE_KEY = "wmm_pregame_odds";
const ODDS_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function loadCachedOdds(): OddsGame[] | null {
  try {
    const raw = localStorage.getItem(ODDS_CACHE_KEY);
    if (!raw) return null;
    const { odds, fetchedAt } = JSON.parse(raw);
    if (Date.now() - fetchedAt > ODDS_CACHE_TTL_MS) return null;
    return odds as OddsGame[];
  } catch {
    return null;
  }
}

function saveCachedOdds(odds: OddsGame[]) {
  try {
    localStorage.setItem(ODDS_CACHE_KEY, JSON.stringify({ odds, fetchedAt: Date.now() }));
  } catch {
    // localStorage unavailable — not critical
  }
}

export default function Dashboard() {
  const [games, setGames] = useState<MergedGame[]>([]);
  const oddsRef = useRef<OddsGame[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oddsError, setOddsError] = useState<string | null>(null);
  const [oddsFetchedAt, setOddsFetchedAt] = useState<Date | null>(null);

  const fetchScores = useCallback(async () => {
    const res = await fetch("/api/scores");
    if (!res.ok) throw new Error(`Scores API error: ${res.status}`);
    const scores: ScoreGame[] = await res.json();
    if (!Array.isArray(scores)) throw new Error("Unexpected scores response");
    setGames(mergeGames(scores, oddsRef.current));
    setLastUpdated(new Date());
  }, []);

  // Fetch odds from API and cache them
  const fetchAndCacheOdds = useCallback(async (): Promise<OddsGame[]> => {
    const res = await fetch("/api/odds");
    const data = await res.json();
    if (!Array.isArray(data)) {
      setOddsError("Odds unavailable — add your ODDS_API_KEY to .env.local");
      return [];
    }
    saveCachedOdds(data);
    setOddsError(null);
    setOddsFetchedAt(new Date());
    return data as OddsGame[];
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Use cached pregame odds if available — saves API calls
        const cached = loadCachedOdds();
        let currentOdds: OddsGame[];
        if (cached) {
          currentOdds = cached;
          oddsRef.current = cached;
          setOddsError(null);
          // Show when the cached odds were fetched
          try {
            const raw = localStorage.getItem(ODDS_CACHE_KEY);
            if (raw) {
              const { fetchedAt } = JSON.parse(raw);
              setOddsFetchedAt(new Date(fetchedAt));
            }
          } catch { /* ignore */ }
        } else {
          currentOdds = await fetchAndCacheOdds();
          oddsRef.current = currentOdds;
        }

        await fetchScores();
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchScores, fetchAndCacheOdds]);

  // Auto-refresh scores only — odds stay fixed (pregame baseline)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await fetchScores();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Refresh failed");
      }
    }, SCORE_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchScores]);

  const liveGames = games.filter((g) => g.status.state === "in");
  const upcomingGames = games.filter((g) => g.status.state === "pre");
  const finalGames = games.filter((g) => g.status.state === "post");
  const alertGames = games.filter((g) => g.upsetAlert);

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-12 text-center bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="text-4xl mb-3">🏀🤑🏀</div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          Women&apos;s March Madness
        </h1>
        <p className="text-xl sm:text-2xl font-semibold text-white mt-2">
          Bet Flagger
        </p>
        <p className="text-sm text-gray-500 mt-2 tracking-widest uppercase">
          Live Sweet Spot Detection
        </p>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
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

        {alertGames.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
              🤑🤑 Sweet Spot Alerts 🤑🤑
              <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {alertGames.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {alertGames.map((g) => <GameCard key={g.id} game={g} />)}
            </div>
          </section>
        )}

        {liveGames.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              Live Games
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveGames.filter((g) => !g.upsetAlert).map((g) => <GameCard key={g.id} game={g} />)}
            </div>
          </section>
        )}

        {upcomingGames.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-blue-400 mb-3">Upcoming Games</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingGames.map((g) => <GameCard key={g.id} game={g} />)}
            </div>
          </section>
        )}

        {finalGames.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-500 mb-3">Final</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
              {finalGames.map((g) => <GameCard key={g.id} game={g} />)}
            </div>
          </section>
        )}

        {!loading && games.length === 0 && !error && (
          <div className="text-center py-20 text-gray-500">
            No WNCAAB games found right now. Check back during the tournament!
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-8 py-4 flex flex-col items-center gap-2">
        {lastUpdated && (
          <p className="text-xs text-gray-500">
            Scores updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
        {oddsFetchedAt && (
          <p className="text-xs text-gray-600">
            Odds from {oddsFetchedAt.toLocaleTimeString()}
          </p>
        )}
        <div className="flex gap-4">
          <button
            onClick={async () => {
              try { await fetchScores(); } catch (e) {
                setError(e instanceof Error ? e.message : "Refresh failed");
              }
            }}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Refresh scores
          </button>
          <button
            onClick={async () => {
              try {
                const fresh = await fetchAndCacheOdds();
                oddsRef.current = fresh;
                await fetchScores();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Odds refresh failed");
              }
            }}
            className="text-xs text-gray-500 hover:text-gray-400 underline"
          >
            Refresh odds
          </button>
        </div>
      </footer>
    </main>
  );
}
