"use client";

import Image from "next/image";
import type { MergedGame } from "@/types";

interface Props {
  game: MergedGame;
}

function TeamLogo({ logo, name }: { logo: string; name: string }) {
  if (!logo) {
    return (
      <div className="w-12 h-12 flex items-center justify-center text-xs font-bold text-gray-300">
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
      className="object-contain"
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
          ? "border-green-500 bg-green-950/60 animate-pulse"
          : "border-gray-700 bg-gray-900"}
      `}
    >
      {/* Upset alert banner */}
      {game.upsetAlert && (
        <div className="absolute -top-3 left-4 right-4 flex items-center justify-center">
          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wide">
            🤑🤑 Sweet Spot Alert 🤑🤑
          </span>
        </div>
      )}

      {/* Status pill */}
      <div className="flex items-center">
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
      </div>

      {/* Teams + scores */}
      <div className="flex flex-col gap-3">
        {[
          { team: game.away },
          { team: game.home },
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

      {/* Pregame odds */}
      {game.spread ? (
        <div className="border-t border-gray-800 pt-3">
          <p className="text-xs text-gray-500 mb-1">Pregame odds</p>
          <p className="text-sm text-white">
            <span className="font-medium">{game.spread.favorite}</span>
            <span className="text-gray-400"> -{game.spread.points}</span>
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-600 border-t border-gray-800 pt-3">No odds available</p>
      )}
    </div>
  );
}
