import { promises as fs } from "fs";
import path from "path";
import type {
  FeedItem,
  PairingLike,
  PairingMetric,
  PairingSave,
  ScrapeJob,
  ScrapeResult,
  SocialDatabase,
  SocialPairing,
  SocialUser,
} from "@/lib/socialTypes";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "social-db.json");

let writeQueue: Promise<void> = Promise.resolve();

const EMPTY_DB: SocialDatabase = {
  users: [],
  pairings: [],
  pairingMetrics: [],
  likes: [],
  saves: [],
  pairingTags: [],
  scrapeJobs: [],
  scrapeResults: [],
};

export async function upsertUser(handle: string, bio = "") {
  return mutateDb((db) => {
    const cleanHandle = normalizeHandle(handle);
    if (!cleanHandle) throw new Error("Handle is required");
    const existing = db.users.find((user) => user.handle.toLowerCase() === cleanHandle.toLowerCase());
    if (existing) return existing;
    const user: SocialUser = {
      id: createId("user"),
      handle: cleanHandle,
      bio: bio.slice(0, 160),
      createdAt: now(),
    };
    db.users.push(user);
    return user;
  });
}

export async function getUser(userId: string) {
  const db = await readDb();
  return db.users.find((user) => user.id === userId) ?? null;
}

export async function createPairing(input: {
  userId: string;
  title: string;
  description?: string;
  tags?: string[];
  sourceUrl?: string | null;
  sourceDomain?: string | null;
  brandSummary?: string | null;
  published?: boolean;
  config: SocialPairing["config"];
}) {
  return mutateDb((db) => {
    const user = db.users.find((x) => x.id === input.userId);
    if (!user) throw new Error("User not found");

    const pairing: SocialPairing = {
      id: createId("pairing"),
      userId: input.userId,
      title: input.title.trim().slice(0, 90) || "Untitled Pairing",
      description: (input.description || "").trim().slice(0, 400),
      tags: uniqTags(input.tags || []),
      sourceUrl: input.sourceUrl || null,
      sourceDomain: input.sourceDomain || null,
      brandSummary: input.brandSummary || null,
      config: input.config,
      createdAt: now(),
      updatedAt: now(),
      published: input.published ?? true,
    };

    db.pairings.unshift(pairing);
    db.pairingMetrics.push({ pairingId: pairing.id, likesCount: 0, savesCount: 0 });
    for (const tag of pairing.tags) db.pairingTags.push({ pairingId: pairing.id, tag });
    return pairing;
  });
}

export async function getFeed(input: {
  viewerId?: string | null;
  query?: string | null;
  tag?: string | null;
  sort?: "latest" | "trending";
  limit?: number;
}) {
  const db = await readDb();
  const sort = input.sort || "latest";
  const query = (input.query || "").trim().toLowerCase();
  const tag = (input.tag || "").trim().toLowerCase();
  const limit = Math.max(1, Math.min(input.limit || 30, 100));

  let pairings = db.pairings.filter((pairing) => pairing.published);

  if (query) {
    pairings = pairings.filter((pairing) => {
      return (
        pairing.title.toLowerCase().includes(query) ||
        pairing.description.toLowerCase().includes(query) ||
        pairing.tags.some((x) => x.toLowerCase().includes(query)) ||
        (pairing.sourceDomain || "").toLowerCase().includes(query)
      );
    });
  }
  if (tag) {
    pairings = pairings.filter((pairing) => pairing.tags.some((x) => x.toLowerCase() === tag));
  }

  if (sort === "trending") {
    pairings.sort((a, b) => {
      const am = getMetric(db.pairingMetrics, a.id);
      const bm = getMetric(db.pairingMetrics, b.id);
      const aScore = am.likesCount * 2 + am.savesCount * 3;
      const bScore = bm.likesCount * 2 + bm.savesCount * 3;
      if (aScore !== bScore) return bScore - aScore;
      return b.createdAt.localeCompare(a.createdAt);
    });
  } else {
    pairings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return pairings.slice(0, limit).map((pairing) => {
    const author = db.users.find((x) => x.id === pairing.userId);
    const metrics = getMetric(db.pairingMetrics, pairing.id);
    const likedByViewer = Boolean(input.viewerId && db.likes.some((x) => x.pairingId === pairing.id && x.userId === input.viewerId));
    const savedByViewer = Boolean(input.viewerId && db.saves.some((x) => x.pairingId === pairing.id && x.userId === input.viewerId));
    return {
      pairing,
      author: author || {
        id: "deleted",
        handle: "Unknown",
        bio: "",
        createdAt: now(),
      },
      metrics,
      likedByViewer,
      savedByViewer,
    } satisfies FeedItem;
  });
}

export async function toggleLike(input: { pairingId: string; userId: string }) {
  return mutateDb((db) => {
    const pairing = db.pairings.find((x) => x.id === input.pairingId);
    const user = db.users.find((x) => x.id === input.userId);
    if (!pairing) throw new Error("Pairing not found");
    if (!user) throw new Error("User not found");

    const index = db.likes.findIndex((x) => x.pairingId === input.pairingId && x.userId === input.userId);
    let liked: boolean;
    if (index >= 0) {
      db.likes.splice(index, 1);
      liked = false;
    } else {
      const like: PairingLike = {
        id: createId("like"),
        pairingId: input.pairingId,
        userId: input.userId,
        createdAt: now(),
      };
      db.likes.push(like);
      liked = true;
    }
    const metrics = recalcMetric(db, input.pairingId);
    return { liked, metrics };
  });
}

export async function toggleSave(input: { pairingId: string; userId: string }) {
  return mutateDb((db) => {
    const pairing = db.pairings.find((x) => x.id === input.pairingId);
    const user = db.users.find((x) => x.id === input.userId);
    if (!pairing) throw new Error("Pairing not found");
    if (!user) throw new Error("User not found");

    const index = db.saves.findIndex((x) => x.pairingId === input.pairingId && x.userId === input.userId);
    let saved: boolean;
    if (index >= 0) {
      db.saves.splice(index, 1);
      saved = false;
    } else {
      const save: PairingSave = {
        id: createId("save"),
        pairingId: input.pairingId,
        userId: input.userId,
        createdAt: now(),
      };
      db.saves.push(save);
      saved = true;
    }
    const metrics = recalcMetric(db, input.pairingId);
    return { saved, metrics };
  });
}

export async function getProfile(input: { userId: string; viewerId?: string | null }) {
  const db = await readDb();
  const user = db.users.find((x) => x.id === input.userId);
  if (!user) throw new Error("User not found");
  const published = await getFeed({
    viewerId: input.viewerId,
    sort: "latest",
    limit: 100,
  });
  const publishedByUser = published.filter((item) => item.pairing.userId === user.id);
  const savedPairingIds = db.saves.filter((x) => x.userId === user.id).map((x) => x.pairingId);
  const saved = published.filter((item) => savedPairingIds.includes(item.pairing.id));
  return { user, published: publishedByUser, saved };
}

export async function createScrapeJob(input: { userId: string; url: string; normalizedDomain: string }) {
  return mutateDb((db) => {
    const job: ScrapeJob = {
      id: createId("job"),
      userId: input.userId,
      url: input.url,
      normalizedDomain: input.normalizedDomain,
      status: "queued",
      error: null,
      resultId: null,
      createdAt: now(),
      updatedAt: now(),
    };
    db.scrapeJobs.unshift(job);
    return job;
  });
}

export async function markScrapeJobProcessing(jobId: string) {
  return mutateDb((db) => {
    const job = db.scrapeJobs.find((x) => x.id === jobId);
    if (!job) throw new Error("Scrape job not found");
    job.status = "processing";
    job.updatedAt = now();
    return job;
  });
}

export async function completeScrapeJob(jobId: string, result: Omit<ScrapeResult, "id" | "createdAt">) {
  return mutateDb((db) => {
    const job = db.scrapeJobs.find((x) => x.id === jobId);
    if (!job) throw new Error("Scrape job not found");
    const nextResult: ScrapeResult = {
      id: createId("scrape"),
      createdAt: now(),
      ...result,
    };
    db.scrapeResults.unshift(nextResult);
    job.status = "completed";
    job.resultId = nextResult.id;
    job.error = null;
    job.updatedAt = now();
    return { job, result: nextResult };
  });
}

export async function failScrapeJob(jobId: string, errorMessage: string) {
  return mutateDb((db) => {
    const job = db.scrapeJobs.find((x) => x.id === jobId);
    if (!job) throw new Error("Scrape job not found");
    job.status = "failed";
    job.error = errorMessage.slice(0, 500);
    job.updatedAt = now();
    return job;
  });
}

function normalizeHandle(input: string) {
  return input
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "")
    .slice(0, 32);
}

function uniqTags(tags: string[]) {
  const unique = new Set<string>();
  for (const tag of tags) {
    const clean = tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
    if (clean) unique.add(clean);
    if (unique.size >= 8) break;
  }
  return Array.from(unique);
}

function getMetric(metrics: PairingMetric[], pairingId: string): PairingMetric {
  const existing = metrics.find((x) => x.pairingId === pairingId);
  if (existing) return existing;
  return { pairingId, likesCount: 0, savesCount: 0 };
}

function recalcMetric(db: SocialDatabase, pairingId: string) {
  const likesCount = db.likes.filter((x) => x.pairingId === pairingId).length;
  const savesCount = db.saves.filter((x) => x.pairingId === pairingId).length;
  const existing = db.pairingMetrics.find((x) => x.pairingId === pairingId);
  if (existing) {
    existing.likesCount = likesCount;
    existing.savesCount = savesCount;
    return existing;
  }
  const metric = { pairingId, likesCount, savesCount };
  db.pairingMetrics.push(metric);
  return metric;
}

async function mutateDb<T>(mutator: (db: SocialDatabase) => T | Promise<T>) {
  let value: T;
  writeQueue = writeQueue.then(async () => {
    const db = await readDb();
    value = await mutator(db);
    await writeDb(db);
  });
  await writeQueue;
  return value!;
}

async function readDb(): Promise<SocialDatabase> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<SocialDatabase>;
    return {
      ...EMPTY_DB,
      ...parsed,
      users: parsed.users || [],
      pairings: parsed.pairings || [],
      pairingMetrics: parsed.pairingMetrics || [],
      likes: parsed.likes || [],
      saves: parsed.saves || [],
      pairingTags: parsed.pairingTags || [],
      scrapeJobs: parsed.scrapeJobs || [],
      scrapeResults: parsed.scrapeResults || [],
    };
  } catch {
    await writeDb(EMPTY_DB);
    return structuredClone(EMPTY_DB);
  }
}

async function writeDb(db: SocialDatabase) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function now() {
  return new Date().toISOString();
}
