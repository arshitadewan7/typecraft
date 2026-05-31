import { NextResponse } from "next/server";
import { toggleSave } from "@/lib/server/socialDb";

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const body = await req.json();
    const result = await toggleSave({
      pairingId: ctx.params.id,
      userId: String(body?.userId || ""),
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to toggle save";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
