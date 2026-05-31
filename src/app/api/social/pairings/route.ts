import { NextResponse } from "next/server";
import { createPairing } from "@/lib/server/socialDb";
import type { ProjectSnapshot } from "@/lib/types";

function parseTags(input: unknown) {
  if (Array.isArray(input)) return input.map((x) => String(x));
  if (typeof input === "string") {
    return input
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pairing = await createPairing({
      userId: String(body?.userId || ""),
      title: String(body?.title || ""),
      description: String(body?.description || ""),
      tags: parseTags(body?.tags),
      sourceUrl: body?.sourceUrl ? String(body.sourceUrl) : null,
      sourceDomain: body?.sourceDomain ? String(body.sourceDomain) : null,
      brandSummary: body?.brandSummary ? String(body.brandSummary) : null,
      published: body?.published !== false,
      config: body?.config as ProjectSnapshot,
    });
    return NextResponse.json({ ok: true, pairing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create pairing";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
