"use client";

import Image from "next/image";
import type { MergedGame } from "@/types";

interface Props {
  game: MergedGame;
}

function formatMoneyline(ml: number): string {
  return ml > 0 ? `+${ml}` : `${ml}`;
}

function formatSpread(spread: MergedGame["spread"]): string {
  if (!spread) return "—";
  return `${spread.favorite} -${spread.points}`;
}

function TeamLogo({ logo, name }: { logo: string; name: string }) {
  if (!logo) {
    return (
      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
        {name.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return (
    <Image
      src={logo}
      alt={name}
      width={48}
      height={48}
      className="rounded-full object-contain"
      unoptimized
    />
  );
}

function ScoreBadge({ score, winner }: { score: string | null; winner: boolean }) {
  if (score === null) return <span className="text-gray-500 text-lg">—</span>;
  return (
    <span className={`text-2xl font-bold ${winner ? "text-white" : "text-gray-400"}`}>
      {score}
    </span>
  );
}

export default function GameCard({ game }: Props) {
  const isLive = game.status.state === "in";
  const isFinal = game.status.state === "post";

  return (
    <div
      className={`relative rounded-2xl border p-5 flex flex-col gap-4 shadow-lg transition-all
        ${game.upsetAlert
          ? "border-red-500 bg-red-950/60 animate-pulse"
          : "border-gray-700 bg-gray-900"}
      `}
    >
      {/* Upset alert banner */}
      {game.upsetAlert && (
        <div className="absolute -top-3 left-4 right-4 flex items-center justify-center">
          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wide">
            🚨 Upset Alert — Check Live Odds!
          </span>
        </div>
      )}

      {/* Status pill */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full
            ${isLive ? "bg-green-600 text-white" : isFinal ? "bg-gray-600 text-gray-200" : "bg-blue-800 text-blue-200"}
          `}
        >
          {isLive
            ? `LIVE · Q${game.status.period} ${game.status.clock}`
            : isFinal
            ? "FINAL"
            : new Date(game.date).toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
        </span>

        {game.spread && (
          <span className="text-xs text-gray-400">
            Spread: <span className="text-white font-medium">{formatSpread(game.spread)}</span>
          </span>
        )}
      </div>

      {/* Teams + scores */}
      <div className="flex flex-col gap-3">
        {[
          { team: game.away, label: "Away" },
          { team: game.home, label: "Home" },
        ].map(({ team }) => (
          <div key={team.name} className="flex items-center gap-3">
            <TeamLogo logo={team.logo} name={team.name} />
            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${team.winner ? "text-white" : "text-gray-300"}`}>
                {team.name}
              </p>
              <p className="text-xs text-gray-500">{team.abbreviation}</p>
            </div>
            <ScoreBadge score={team.score} winner={team.winner} />
          </div>
        ))}
      </div>

      {/* Moneyline row */}
      {game.moneyline && (
        <div className="flex gap-4 border-t border-gray-800 pt-3 text-sm">
          <div className="flex-1 text-center">
            <p className="text-gray-500 text-xs">Away ML</p>
            <p className="font-medium text-yellow-400">{formatMoneyline(game.moneyline.away)}</p>
          </div>
          <div className="w-px bg-gray-700" />
          <div className="flex-1 text-center">
            <p className="text-gray-500 text-xs">Home ML</p>
            <p className="font-medium text-yellow-400">{formatMoneyline(game.moneyline.home)}</p>
          </div>
        </div>
      )}

      {!game.moneyline && !game.spread && (
        <p className="text-xs text-gray-600 text-center">No odds available</p>
      )}
    </div>
  );
}
