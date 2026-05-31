import type { ProjectSnapshot } from "@/lib/types";

export type SocialUser = {
  id: string;
  handle: string;
  bio: string;
  createdAt: string;
};

export type SocialPairing = {
  id: string;
  userId: string;
  title: string;
  description: string;
  tags: string[];
  sourceUrl: string | null;
  sourceDomain: string | null;
  brandSummary: string | null;
  config: ProjectSnapshot;
  createdAt: string;
  updatedAt: string;
  published: boolean;
};

export type PairingMetric = {
  pairingId: string;
  likesCount: number;
  savesCount: number;
};

export type PairingLike = {
  id: string;
  pairingId: string;
  userId: string;
  createdAt: string;
};

export type PairingSave = {
  id: string;
  pairingId: string;
  userId: string;
  createdAt: string;
};

export type PairingTag = {
  pairingId: string;
  tag: string;
};

export type ScrapeJobStatus = "queued" | "processing" | "completed" | "failed";

export type ScrapeJob = {
  id: string;
  userId: string;
  url: string;
  normalizedDomain: string;
  status: ScrapeJobStatus;
  error: string | null;
  resultId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScrapeResult = {
  id: string;
  jobId: string;
  url: string;
  normalizedDomain: string;
  colors: string[];
  fontFamilies: string[];
  inferredHeadingFont: string;
  inferredBodyFont: string;
  brandSummary: string;
  screenshotUrl: string | null;
  cssMetadata: Record<string, string>;
  createdAt: string;
};

export type SocialDatabase = {
  users: SocialUser[];
  pairings: SocialPairing[];
  pairingMetrics: PairingMetric[];
  likes: PairingLike[];
  saves: PairingSave[];
  pairingTags: PairingTag[];
  scrapeJobs: ScrapeJob[];
  scrapeResults: ScrapeResult[];
};

export type FeedItem = {
  pairing: SocialPairing;
  author: SocialUser;
  metrics: PairingMetric;
  likedByViewer: boolean;
  savedByViewer: boolean;
};
