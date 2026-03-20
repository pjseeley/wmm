import { NextResponse } from "next/server";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";
const SPORT_KEY = "basketball_wncaab";

export async function GET() {
  const apiKey = process.env.ODDS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ODDS_API_KEY not configured" },
      { status: 500 }
    );
  }

  const url = new URL(`${ODDS_API_BASE}/sports/${SPORT_KEY}/odds`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", "h2h,spreads");
  url.searchParams.set("oddsFormat", "american");

  const res = await fetch(url.toString(), {
    next: { revalidate: 43200 }, // cache 12h server-side — shared across all users on Vercel
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Odds API error: ${res.status}`, detail: text },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
