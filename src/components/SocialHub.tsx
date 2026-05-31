"use client";
import { useEffect, useMemo, useState } from "react";
import type { FeedItem, SocialUser } from "@/lib/socialTypes";
import type { ProjectSnapshot } from "@/lib/types";

type DraftPairing = {
  title: string;
  description: string;
  sourceUrl: string;
  sourceDomain: string;
  brandSummary: string;
  tags: string[];
  config: ProjectSnapshot;
};

type ProfilePayload = {
  user: SocialUser;
  published: FeedItem[];
  saved: FeedItem[];
};

interface SocialHubProps {
  currentSnapshot: ProjectSnapshot;
  onApplyPairing: (snapshot: ProjectSnapshot) => void;
}

const USER_STORAGE_KEY = "typecraft.social.user";

export default function SocialHub({ currentSnapshot, onApplyPairing }: SocialHubProps) {
  const [user, setUser] = useState<SocialUser | null>(null);
  const [handle, setHandle] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [sort, setSort] = useState<"latest" | "trending">("latest");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");

  const [publishBusy, setPublishBusy] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [scrapeBusy, setScrapeBusy] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [draftPairing, setDraftPairing] = useState<DraftPairing | null>(null);

  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SocialUser;
      if (parsed?.id) {
        setUser(parsed);
        setHandle(parsed.handle);
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  useEffect(() => {
    void refreshFeed();
  }, [sort]);

  useEffect(() => {
    if (!user) return;
    void refreshFeed();
  }, [user?.id]);

  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of feed) {
      for (const nextTag of item.pairing.tags) {
        counts.set(nextTag, (counts.get(nextTag) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([nextTag]) => nextTag);
  }, [feed]);

  async function refreshFeed() {
    setLoadingFeed(true);
    setFeedError(null);
    try {
      const params = new URLSearchParams();
      params.set("sort", sort);
      if (user?.id) params.set("viewerId", user.id);
      if (search.trim()) params.set("q", search.trim());
      if (tag.trim()) params.set("tag", tag.trim());
      const res = await fetch(`/api/social/feed?${params.toString()}`, { method: "GET" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Unable to load feed");
      setFeed(data.feed || []);
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : "Unable to load feed");
    } finally {
      setLoadingFeed(false);
    }
  }

  async function signIn() {
    if (!handle.trim()) return;
    setLoadingAuth(true);
    setFeedError(null);
    try {
      const res = await fetch("/api/social/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle: handle.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Unable to sign in");
      setUser(data.user);
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      setProfile(null);
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setLoadingAuth(false);
    }
  }

  async function publishCurrentPairing() {
    if (!user) {
      setFeedError("Sign in to publish pairings.");
      return;
    }
    setPublishBusy(true);
    setFeedError(null);
    try {
      const now = new Date();
      const generatedTitle = draftPairing?.title || `Pairing ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const generatedDescription =
        draftPairing?.description ||
        `${currentSnapshot.headingFont} heading with ${currentSnapshot.bodyFont} body.`;

      const res = await fetch("/api/social/pairings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: generatedTitle,
          description: generatedDescription,
          tags:
            draftPairing?.tags?.length
              ? draftPairing.tags
              : [
                  currentSnapshot.headingFont.split(" ")[0].toLowerCase(),
                  currentSnapshot.bodyFont.split(" ")[0].toLowerCase(),
                  "pairing",
                ],
          sourceUrl: draftPairing?.sourceUrl || null,
          sourceDomain: draftPairing?.sourceDomain || null,
          brandSummary: draftPairing?.brandSummary || null,
          config: currentSnapshot,
          published: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Unable to publish pairing");
      setDraftPairing(null);
      await refreshFeed();
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : "Unable to publish pairing");
    } finally {
      setPublishBusy(false);
    }
  }

  async function toggleLike(pairingId: string) {
    if (!user) {
      setFeedError("Sign in to like pairings.");
      return;
    }
    const res = await fetch(`/api/social/pairings/${pairingId}/like`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setFeedError(data.error || "Unable to toggle like");
      return;
    }
    setFeed((prev) =>
      prev.map((item) =>
        item.pairing.id === pairingId ? { ...item, likedByViewer: data.liked, metrics: data.metrics } : item,
      ),
    );
  }

  async function toggleSave(pairingId: string) {
    if (!user) {
      setFeedError("Sign in to save pairings.");
      return;
    }
    const res = await fetch(`/api/social/pairings/${pairingId}/save`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setFeedError(data.error || "Unable to toggle save");
      return;
    }
    setFeed((prev) =>
      prev.map((item) =>
        item.pairing.id === pairingId ? { ...item, savedByViewer: data.saved, metrics: data.metrics } : item,
      ),
    );
  }

  async function scrapeUrl() {
    if (!user) {
      setScrapeError("Sign in to create pairings from websites.");
      return;
    }
    if (!urlInput.trim()) return;
    setScrapeBusy(true);
    setScrapeError(null);
    try {
      const res = await fetch("/api/social/scrape", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: user.id, url: urlInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Unable to scrape website");
      setDraftPairing(data.draftPairing);
      onApplyPairing(data.draftPairing.config);
    } catch (error) {
      setScrapeError(error instanceof Error ? error.message : "Unable to scrape website");
    } finally {
      setScrapeBusy(false);
    }
  }

  async function loadMyProfile() {
    if (!user) return;
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/social/profile/${user.id}?viewerId=${user.id}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Unable to load profile");
      setProfile(data.profile);
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : "Unable to load profile");
    } finally {
      setLoadingProfile(false);
    }
  }

  return (
    <div className="social-shell fade-in">
      <div className="social-topbar">
        <div className="social-inline">
          <input
            className="font-search"
            style={{ maxWidth: 190 }}
            placeholder="Handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
          <button className="btn" onClick={signIn} disabled={loadingAuth}>
            {loadingAuth ? "..." : user ? "Switch User" : "Sign In"}
          </button>
          {user && <span className="social-pill">@{user.handle}</span>}
          {user && (
            <button className="btn" onClick={loadMyProfile} disabled={loadingProfile}>
              {loadingProfile ? "Loading..." : "My Profile"}
            </button>
          )}
          <button className="social-plus-btn" onClick={publishCurrentPairing} disabled={publishBusy} title="Publish current pairing">
            {publishBusy ? "…" : "+"}
          </button>
        </div>
        <div className="social-inline">
          <input
            className="font-search"
            placeholder="https://brand.com"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <button className="btn primary" onClick={scrapeUrl} disabled={scrapeBusy}>
            {scrapeBusy ? "Extracting..." : "Extract Brand"}
          </button>
          {draftPairing && (
            <>
              <span className="social-pill">Draft: {draftPairing.sourceDomain}</span>
              <button className="btn" onClick={() => onApplyPairing(draftPairing.config)}>
                Apply Draft
              </button>
            </>
          )}
        </div>
        {scrapeError && <div className="social-error">{scrapeError}</div>}
        {feedError && <div className="social-error">{feedError}</div>}
      </div>

      {profile && (
        <div className="social-profile">
          <div className="section-label">Profile Snapshot</div>
          <div className="social-inline">
            <span className="social-pill">Published: {profile.published.length}</span>
            <span className="social-pill">Saved: {profile.saved.length}</span>
          </div>
        </div>
      )}

      <div className="social-feed">
        <div className="social-inline" style={{ marginBottom: 10 }}>
          <button className={`btn ${sort === "latest" ? "primary" : ""}`} onClick={() => setSort("latest")}>
            Latest
          </button>
          <button className={`btn ${sort === "trending" ? "primary" : ""}`} onClick={() => setSort("trending")}>
            Trending
          </button>
          <input
            className="font-search"
            style={{ maxWidth: 200 }}
            placeholder="search pairings"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn" onClick={refreshFeed}>Refresh</button>
        </div>

        {topTags.length > 0 && (
          <div className="social-inline" style={{ marginBottom: 10 }}>
            {topTags.map((nextTag) => (
              <button
                key={nextTag}
                className={`btn ${tag === nextTag ? "primary" : ""}`}
                onClick={() => setTag((prev) => (prev === nextTag ? "" : nextTag))}
              >
                #{nextTag}
              </button>
            ))}
          </div>
        )}

        {loadingFeed && <div className="social-muted">Loading feed...</div>}

        <div className="social-feed-list">
          {feed.map((item) => {
            const config = item.pairing.config;
            const headingFont = `'${config.headingFont}', serif`;
            const bodyFont = `'${config.bodyFont}', sans-serif`;
            const headingStyle = config.headingItalic ? "italic" : "normal";
            const bodyStyle = config.bodyItalic ? "italic" : "normal";
            return (
              <div className="social-card" key={item.pairing.id}>
                <div className="social-card-top">
                  <div>
                    <h3>{item.pairing.title}</h3>
                    <p>@{item.author.handle}</p>
                  </div>
                  {item.pairing.sourceDomain && <span className="social-pill">Inspired by {item.pairing.sourceDomain}</span>}
                </div>

                <div className="social-preview" style={{ background: config.theme.bg, color: config.theme.text }}>
                  <div
                    style={{
                      fontFamily: headingFont,
                      fontSize: Math.min(config.headingSize * 0.55, 32),
                      fontWeight: config.headingWeight,
                      fontStyle: headingStyle,
                      letterSpacing: config.headingSpacing,
                      lineHeight: 1.1,
                    }}
                  >
                    Crafted Pairing
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontFamily: bodyFont,
                      fontSize: Math.min(config.bodySize, 18),
                      fontWeight: config.bodyWeight,
                      fontStyle: bodyStyle,
                      lineHeight: config.lineHeight,
                      opacity: 0.85,
                    }}
                  >
                    Visual hierarchy inspired by brand identity.
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      display: "inline-block",
                      padding: "5px 12px",
                      borderRadius: 4,
                      background: config.theme.accent,
                      color: config.theme.bg,
                      fontFamily: bodyFont,
                      fontWeight: config.bodyWeight,
                      fontStyle: bodyStyle,
                      fontSize: 12,
                    }}
                  >
                    Preview
                  </div>
                </div>

                <p className="social-description">{item.pairing.description || "No description provided."}</p>
                <div className="social-inline">
                  {item.pairing.tags.map((nextTag) => (
                    <span key={nextTag} className="social-pill">#{nextTag}</span>
                  ))}
                </div>
                <div className="social-inline">
                  <button className="btn" onClick={() => onApplyPairing(config)}>Use Pairing</button>
                  <button className={`btn ${item.likedByViewer ? "primary" : ""}`} onClick={() => toggleLike(item.pairing.id)}>
                    Like {item.metrics.likesCount}
                  </button>
                  <button className={`btn ${item.savedByViewer ? "primary" : ""}`} onClick={() => toggleSave(item.pairing.id)}>
                    Save {item.metrics.savesCount}
                  </button>
                </div>
              </div>
            );
          })}
          {!loadingFeed && feed.length === 0 && (
            <div className="social-muted">No pairings yet. Click `+` to publish your current pairing.</div>
          )}
        </div>
      </div>
    </div>
  );
}
