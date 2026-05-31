import { ALL_FONTS, THEMES } from "@/lib/data";
import { DEFAULT_TYPOGRAPHY_STATE, stateToProjectSnapshot } from "@/lib/projectAdapter";
import type { ProjectSnapshot } from "@/lib/types";

type ExtractedBrandIdentity = {
  normalizedUrl: string;
  normalizedDomain: string;
  colors: string[];
  fontFamilies: string[];
  inferredHeadingFont: string;
  inferredBodyFont: string;
  brandSummary: string;
  cssMetadata: Record<string, string>;
  draftSnapshot: ProjectSnapshot;
};

export async function extractBrandIdentity(inputUrl: string): Promise<ExtractedBrandIdentity> {
  const normalizedUrl = normalizeAndValidateUrl(inputUrl);
  await assertRobotsAllowed(normalizedUrl);
  const html = await fetchHtml(normalizedUrl);
  const normalizedDomain = new URL(normalizedUrl).hostname;

  const colors = pickTopColors(extractHexColors(html));
  const fontFamilies = extractFontFamilies(html);
  const inferredHeadingFont = mapFontFamilyToCatalog(fontFamilies[0] || "serif", "heading");
  const inferredBodyFont = mapFontFamilyToCatalog(fontFamilies[1] || fontFamilies[0] || "sans-serif", "body");
  const theme = buildTheme(colors);
  const title = extractMeta(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || normalizedDomain;
  const description =
    extractMeta(html, /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i) ||
    extractMeta(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i) ||
    "Brand identity extracted from website styles.";
  const brandSummary = `${title} — ${description}`.slice(0, 240);

  const draftSnapshot = stateToProjectSnapshot({
    ...DEFAULT_TYPOGRAPHY_STATE,
    headingFont: inferredHeadingFont,
    bodyFont: inferredBodyFont,
    theme,
  });

  return {
    normalizedUrl,
    normalizedDomain,
    colors,
    fontFamilies,
    inferredHeadingFont,
    inferredBodyFont,
    brandSummary,
    cssMetadata: {
      title,
      description,
      domain: normalizedDomain,
    },
    draftSnapshot,
  };
}

export function normalizeAndValidateUrl(input: string) {
  let normalized: URL;
  try {
    const withScheme = /^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`;
    normalized = new URL(withScheme);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(normalized.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are supported");
  }
  const host = normalized.hostname.toLowerCase();
  if (isBlockedHost(host)) {
    throw new Error("URL is not allowed");
  }

  normalized.hash = "";
  return normalized.toString();
}

async function assertRobotsAllowed(urlString: string) {
  try {
    const url = new URL(urlString);
    const robotsUrl = `${url.protocol}//${url.hostname}/robots.txt`;
    const res = await fetch(robotsUrl, {
      method: "GET",
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return;
    const text = (await res.text()).toLowerCase();
    const blocked = /user-agent:\s*\*\s*(?:#.*\n|\s)*disallow:\s*\/(?:\s|$)/i.test(text);
    if (blocked) throw new Error("Scraping disallowed by robots.txt");
  } catch (error) {
    if (error instanceof Error && /robots\.txt/i.test(error.message)) throw error;
  }
}

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    next: { revalidate: 0 },
    headers: {
      "user-agent": "TypecraftBot/1.0 (+brand pairing extraction)",
    },
  });
  if (!res.ok) {
    throw new Error(`Unable to fetch website (${res.status})`);
  }
  const text = await res.text();
  return text.slice(0, 900_000);
}

function extractHexColors(input: string) {
  const matches = input.match(/#[0-9a-fA-F]{6}\b/g) || [];
  return matches.map((x) => x.toUpperCase());
}

function pickTopColors(input: string[]) {
  const counts = new Map<string, number>();
  for (const color of input) counts.set(color, (counts.get(color) || 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([color]) => color);
}

function extractFontFamilies(html: string) {
  const families: string[] = [];
  const regex = /font-family\s*:\s*([^;}{]+)/gi;
  let match: RegExpExecArray | null = regex.exec(html);
  while (match) {
    const raw = match[1]
      .replace(/["']/g, "")
      .split(",")
      .map((x) => x.trim())
      .find((x) => x.length > 0);
    if (raw) families.push(raw);
    if (families.length > 50) break;
    match = regex.exec(html);
  }

  const unique = Array.from(new Set(families.map((x) => x.toLowerCase()))).map((lower) => {
    return families.find((x) => x.toLowerCase() === lower) || lower;
  });
  return unique.slice(0, 12);
}

function mapFontFamilyToCatalog(source: string, target: "heading" | "body") {
  const lower = source.toLowerCase();
  const exact = ALL_FONTS.find((font) => font.name.toLowerCase() === lower);
  if (exact) return exact.name;

  const contains = ALL_FONTS.find((font) => lower.includes(font.name.toLowerCase()) || font.name.toLowerCase().includes(lower));
  if (contains) return contains.name;

  if (target === "heading") {
    if (lower.includes("sans")) return "Inter";
    if (lower.includes("mono")) return "JetBrains Mono";
    return "Garamond Premier Roman";
  }
  if (lower.includes("serif")) return "Source Serif 4";
  if (lower.includes("mono")) return "JetBrains Mono";
  return "Inter";
}

function buildTheme(colors: string[]) {
  const fallback = THEMES[0];
  const bg = colors[0] || fallback.bg;
  const text = colors[1] || fallback.text;
  const accent = colors[2] || fallback.accent;
  const secondary = colors[3] || fallback.secondary;
  return {
    name: "Inspired",
    bg,
    text,
    accent,
    secondary,
  };
}

function extractMeta(input: string, regex: RegExp) {
  const match = input.match(regex);
  if (!match || !match[1]) return null;
  return decodeHtml(match[1].trim().replace(/\s+/g, " "));
}

function decodeHtml(input: string) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function isBlockedHost(host: string) {
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".local")) return true;
  if (host === "0.0.0.0") return true;
  if (host.startsWith("127.")) return true;
  if (host.startsWith("10.")) return true;
  if (host.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(host)) return true;
  if (host.startsWith("169.254.")) return true;
  if (host.startsWith("[::1]")) return true;
  if (host.includes("internal")) return true;
  return false;
}
