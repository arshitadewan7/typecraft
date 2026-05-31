import { NextResponse } from "next/server";
import { getFeed } from "@/lib/server/socialDb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const viewerId = searchParams.get("viewerId");
    const q = searchParams.get("q");
    const tag = searchParams.get("tag");
    const sort = searchParams.get("sort") === "trending" ? "trending" : "latest";
    const limit = Number(searchParams.get("limit") || "30");
    const feed = await getFeed({ viewerId, query: q, tag, sort, limit });
    return NextResponse.json({ ok: true, feed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load feed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
