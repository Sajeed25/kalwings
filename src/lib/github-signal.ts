import "server-only";
import { summariseRepos, githubUsername, type GithubSignal } from "@/lib/github-parse";
export type { GithubSignal };

const TTL = 6 * 60 * 60_000, NEG_TTL = 30 * 60_000;
const cache = new Map<string, { at: number; v: GithubSignal | null }>();

/**
 * Public GitHub activity for a username, from GitHub's free public API (about 60 requests an hour per server address, so results are cached for 6 hours
 * and failures for 30 minutes). Called on the server only. If GitHub is slow, down or rate limiting, the Talent Card simply omits the line.
 * This is public, self-declared data: Kalwings does not verify it and says so on the page.
 */
export async function githubSignal(url: string | null | undefined): Promise<GithubSignal | null> {
  const user = githubUsername(url); if (!user) return null;
  const hit = cache.get(user);
  if (hit && Date.now() - hit.at < (hit.v ? TTL : NEG_TTL)) return hit.v;
  let v: GithubSignal | null = null;
  try {
    const r = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed&type=owner`, { headers: { Accept: "application/vnd.github+json", "User-Agent": "kalwings-talent-card" }, signal: AbortSignal.timeout(4000), cache: "no-store" });
    if (r.ok) v = summariseRepos(user, await r.json());
  } catch { /* offline, timed out or rate limited: omit */ }
  if (cache.size > 500) cache.clear();
  cache.set(user, { at: Date.now(), v });
  return v;
}
