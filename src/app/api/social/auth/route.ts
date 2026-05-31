import { NextResponse } from "next/server";
import { upsertUser } from "@/lib/server/socialDb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const handle = String(body?.handle || "");
    const bio = String(body?.bio || "");
    const user = await upsertUser(handle, bio);
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to authenticate user";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
