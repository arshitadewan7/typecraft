import { NextResponse } from "next/server";
import { extractBrandIdentity } from "@/lib/server/brandExtractor";
import {
  completeScrapeJob,
  createScrapeJob,
  failScrapeJob,
  markScrapeJobProcessing,
  getUser,
} from "@/lib/server/socialDb";

export async function POST(req: Request) {
  let jobId = "";
  try {
    const body = await req.json();
    const userId = String(body?.userId || "");
    const url = String(body?.url || "");
    if (!userId) throw new Error("userId is required");
    if (!url) throw new Error("url is required");
    const user = await getUser(userId);
    if (!user) throw new Error("User not found");

    const extraction = await extractBrandIdentity(url);
    const job = await createScrapeJob({
      userId,
      url: extraction.normalizedUrl,
      normalizedDomain: extraction.normalizedDomain,
    });
    jobId = job.id;
    await markScrapeJobProcessing(job.id);
    const completed = await completeScrapeJob(job.id, {
      jobId: job.id,
      url: extraction.normalizedUrl,
      normalizedDomain: extraction.normalizedDomain,
      colors: extraction.colors,
      fontFamilies: extraction.fontFamilies,
      inferredHeadingFont: extraction.inferredHeadingFont,
      inferredBodyFont: extraction.inferredBodyFont,
      brandSummary: extraction.brandSummary,
      screenshotUrl: null,
      cssMetadata: extraction.cssMetadata,
    });

    return NextResponse.json({
      ok: true,
      job: completed.job,
      result: completed.result,
      draftPairing: {
        title: `Inspired by ${extraction.normalizedDomain}`,
        description: extraction.brandSummary,
        sourceUrl: extraction.normalizedUrl,
        sourceDomain: extraction.normalizedDomain,
        brandSummary: extraction.brandSummary,
        tags: ["inspired", "scraped"],
        config: extraction.draftSnapshot,
      },
    });
  } catch (error) {
    if (jobId) {
      const message = error instanceof Error ? error.message : "Unknown scrape error";
      await failScrapeJob(jobId, message);
    }
    const message = error instanceof Error ? error.message : "Unable to scrape website";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
