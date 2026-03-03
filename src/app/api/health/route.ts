import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    env: process.env.OPENAI_API_KEY ? "API_KEY_SET" : "API_KEY_MISSING",
    node: process.version,
  });
}
