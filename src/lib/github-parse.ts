/** Pure helpers for the GitHub public-activity line (unit tested). */
export type GithubSignal = { user: string; repos: number; languages: string[]; lastPush: string | null };

/** The username in a github.com profile or repository URL, or null for anything else. */
export function githubUsername(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url); if (!/^(www\.)?github\.com$/i.test(u.hostname) || !/^https?:$/.test(u.protocol)) return null;
    const name = u.pathname.split("/").filter(Boolean)[0] ?? "";
    return /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(name) ? name : null;
  } catch { return null; }
}

type Repo = { fork?: boolean; archived?: boolean; language?: string | null; pushed_at?: string | null };
/** Counts the person's own (non-fork) public repositories, the three most used languages and the date of the latest push. */
export function summariseRepos(user: string, data: unknown): GithubSignal | null {
  if (!Array.isArray(data)) return null;
  const own = (data as Repo[]).filter((r) => r && !r.fork);
  const count = new Map<string, number>(); let last = 0;
  for (const r of own) { if (r.language) count.set(r.language, (count.get(r.language) ?? 0) + 1); const t = r.pushed_at ? Date.parse(r.pushed_at) : 0; if (t > last) last = t; }
  const languages = [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3).map(([l]) => l);
  return { user, repos: own.length, languages, lastPush: last ? new Date(last).toISOString() : null };
}
