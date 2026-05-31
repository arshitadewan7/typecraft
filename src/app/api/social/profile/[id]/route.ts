import { NextResponse } from "next/server";
import { getProfile } from "@/lib/server/socialDb";

export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const viewerId = searchParams.get("viewerId");
    const profile = await getProfile({
      userId: ctx.params.id,
      viewerId,
    });
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load profile";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
