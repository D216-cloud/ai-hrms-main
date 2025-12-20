import { NextResponse } from "next/server";

export async function GET(req) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY?.trim?.();

  if (!apiKey) {
    console.warn("OPENAI_API_KEY not configured - returning 503 health check");
    return NextResponse.json({ healthy: false, message: "OPENAI API key not configured" }, { status: 503 });
  }

  // Optionally validate by pinging OpenAI /keys or a lightweight request - but for now just check env var
  return NextResponse.json({ healthy: true, message: "OpenAI configured" }, { status: 200 });
}
