import { NextResponse } from "next/server";

// ESPN public API — no key required
const ESPN_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard";

export async function GET() {
  const res = await fetch(ESPN_URL, {
    next: { revalidate: 0 }, // always fresh for live scores
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `ESPN API error: ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();

  // Normalise into a flat array of games we care about
  const games = (data.events ?? []).map((event: ESPNEvent) => {
    const competition = event.competitions?.[0];
    const competitors = competition?.competitors ?? [];

    const home = competitors.find((c: ESPNCompetitor) => c.homeAway === "home");
    const away = competitors.find((c: ESPNCompetitor) => c.homeAway === "away");

    const status = competition?.status?.type;

    return {
      id: event.id,
      name: event.name,
      shortName: event.shortName,
      date: event.date,
      status: {
        state: status?.state ?? "pre",       // "pre" | "in" | "post"
        description: status?.description ?? "",
        clock: competition?.status?.displayClock ?? "",
        period: competition?.status?.period ?? 0,
      },
      home: {
        id: home?.team?.id,
        name: home?.team?.displayName ?? "",
        abbreviation: home?.team?.abbreviation ?? "",
        logo: home?.team?.logo ?? "",
        score: home?.score ?? null,
        winner: home?.winner ?? false,
      },
      away: {
        id: away?.team?.id,
        name: away?.team?.displayName ?? "",
        abbreviation: away?.team?.abbreviation ?? "",
        logo: away?.team?.logo ?? "",
        score: away?.score ?? null,
        winner: away?.winner ?? false,
      },
    };
  });

  return NextResponse.json(games);
}

// Minimal ESPN type shapes
interface ESPNEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  competitions?: ESPNCompetition[];
}

interface ESPNCompetition {
  competitors?: ESPNCompetitor[];
  status?: {
    type?: { state?: string; description?: string };
    displayClock?: string;
    period?: number;
  };
}

interface ESPNCompetitor {
  homeAway: "home" | "away";
  score?: string;
  winner?: boolean;
  team?: {
    id?: string;
    displayName?: string;
    abbreviation?: string;
    logo?: string;
  };
}
