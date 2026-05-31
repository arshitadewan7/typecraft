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

  const [title, setTitle] = useState("Untitled Pairing");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
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
      // ignore corrupted local storage
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

  async function publishPairing(snapshot: ProjectSnapshot, source?: Partial<DraftPairing>) {
    if (!user) {
      setFeedError("Sign in to publish pairings.");
      return;
    }
    setPublishBusy(true);
    setFeedError(null);
    try {
      const res = await fetch("/api/social/pairings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: source?.title || title,
          description: source?.description || description,
          tags: source?.tags || tagsInput.split(",").map((x) => x.trim()),
          sourceUrl: source?.sourceUrl || null,
          sourceDomain: source?.sourceDomain || null,
          brandSummary: source?.brandSummary || null,
          config: snapshot,
          published: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Unable to publish pairing");
      setDraftPairing(null);
      setUrlInput("");
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
        item.pairing.id === pairingId
          ? { ...item, likedByViewer: data.liked, metrics: data.metrics }
          : item,
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
        item.pairing.id === pairingId
          ? { ...item, savedByViewer: data.saved, metrics: data.metrics }
          : item,
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
      setTitle(data.draftPairing.title);
      setDescription(data.draftPairing.description);
      setTagsInput(data.draftPairing.tags.join(", "));
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
        <div className="social-block">
          <div className="section-label">Account</div>
          <div className="social-inline">
            <input
              className="font-search"
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
          </div>
        </div>

        <div className="social-block">
          <div className="section-label">Create From URL</div>
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
          </div>
          {scrapeError && <div className="social-error">{scrapeError}</div>}
        </div>
      </div>

      <div className="social-grid">
        <div className="social-compose">
          <div className="section-label">Publish Pairing</div>
          <input
            className="font-search"
            placeholder="Pairing title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="social-textarea"
            placeholder="Describe the pairing style"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            className="font-search"
            placeholder="tags (comma separated)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
          <div className="social-inline">
            <button
              className="btn primary"
              onClick={() => publishPairing(currentSnapshot)}
              disabled={publishBusy}
            >
              {publishBusy ? "Publishing..." : "Publish Current Pairing"}
            </button>
            {draftPairing && (
              <button
                className="btn"
                onClick={() => publishPairing(draftPairing.config, draftPairing)}
                disabled={publishBusy}
              >
                Save URL Draft
              </button>
            )}
          </div>

          {draftPairing && (
            <div className="social-draft">
              <div className="section-label">URL Draft Ready</div>
              <p>{draftPairing.brandSummary}</p>
              <div className="social-inline">
                <button className="btn" onClick={() => onApplyPairing(draftPairing.config)}>
                  Apply Draft To Editor
                </button>
                <span className="social-pill">{draftPairing.sourceDomain}</span>
              </div>
            </div>
          )}

          {profile && (
            <div className="social-profile">
              <div className="section-label">Profile Snapshot</div>
              <div className="social-inline">
                <span className="social-pill">Published: {profile.published.length}</span>
                <span className="social-pill">Saved: {profile.saved.length}</span>
              </div>
              <div className="social-mini-list">
                {profile.published.slice(0, 5).map((item) => (
                  <button
                    key={item.pairing.id}
                    className="social-mini-item"
                    onClick={() => onApplyPairing(item.pairing.config)}
                  >
                    <span>{item.pairing.title}</span>
                    <span>{item.metrics.likesCount} likes</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
              style={{ maxWidth: 180 }}
              placeholder="search"
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
                  onClick={() => {
                    setTag((prev) => (prev === nextTag ? "" : nextTag));
                  }}
                >
                  #{nextTag}
                </button>
              ))}
            </div>
          )}

          {feedError && <div className="social-error">{feedError}</div>}
          {loadingFeed && <div className="social-muted">Loading feed...</div>}

          <div className="social-feed-list">
            {feed.map((item) => (
              <div className="social-card" key={item.pairing.id}>
                <div className="social-card-top">
                  <div>
                    <h3>{item.pairing.title}</h3>
                    <p>@{item.author.handle}</p>
                  </div>
                  {item.pairing.sourceDomain && <span className="social-pill">Inspired by {item.pairing.sourceDomain}</span>}
                </div>
                <p className="social-description">{item.pairing.description || "No description provided."}</p>
                <div className="social-inline">
                  {item.pairing.tags.map((nextTag) => (
                    <span key={nextTag} className="social-pill">#{nextTag}</span>
                  ))}
                </div>
                <div className="social-inline">
                  <button className="btn" onClick={() => onApplyPairing(item.pairing.config)}>Apply</button>
                  <button className={`btn ${item.likedByViewer ? "primary" : ""}`} onClick={() => toggleLike(item.pairing.id)}>
                    Like {item.metrics.likesCount}
                  </button>
                  <button className={`btn ${item.savedByViewer ? "primary" : ""}`} onClick={() => toggleSave(item.pairing.id)}>
                    Save {item.metrics.savesCount}
                  </button>
                </div>
              </div>
            ))}
            {!loadingFeed && feed.length === 0 && (
              <div className="social-muted">No pairings yet. Publish one to start the feed.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
