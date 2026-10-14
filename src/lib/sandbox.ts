import "server-only";

/**
 * Code execution adapter. Untrusted code is NEVER run on the application server: it is sent to an isolated
 * Judge0-compatible service (SANDBOX_URL, optional SANDBOX_TOKEN) that enforces CPU, memory and wall-time limits
 * and has networking disabled. When SANDBOX_URL is unset, coding assessments report "unavailable" and nothing runs.
 */
export const LANGS = {
  python: { id: 71, label: "Python 3" },
  javascript: { id: 63, label: "JavaScript (Node)" },
  java: { id: 62, label: "Java" },
  cpp: { id: 54, label: "C++" },
  c: { id: 50, label: "C" },
} as const;
export type LangKey = keyof typeof LANGS;
export const LANG_KEYS = Object.keys(LANGS) as LangKey[];

export const sandboxConfigured = () => !!process.env.SANDBOX_URL;

export type RunResult =
  | { ok: true; outcome: "OK" | "TIME_LIMIT" | "COMPILE_ERROR" | "RUNTIME_ERROR" | "MEMORY_LIMIT"; stdout: string; stderr: string; timeMs: number }
  | { ok: false; error: string };

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const unb64 = (s: unknown) => (typeof s === "string" ? Buffer.from(s, "base64").toString("utf8") : "");

export async function runInSandbox(o: { language: LangKey; code: string; stdin: string; timeLimitMs: number; memoryMb: number }): Promise<RunResult> {
  const base = process.env.SANDBOX_URL;
  if (!base) return { ok: false, error: "Code execution isn't enabled on this platform yet." };
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/submissions?base64_encoded=true&wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(process.env.SANDBOX_TOKEN ? { "X-Auth-Token": process.env.SANDBOX_TOKEN } : {}) },
      body: JSON.stringify({
        language_id: LANGS[o.language].id, source_code: b64(o.code), stdin: b64(o.stdin),
        cpu_time_limit: o.timeLimitMs / 1000, wall_time_limit: Math.min(20, (o.timeLimitMs / 1000) * 3), memory_limit: o.memoryMb * 1024, enable_network: false,
      }),
      signal: AbortSignal.timeout(o.timeLimitMs * 3 + 10_000),
    });
    if (!res.ok) return { ok: false, error: "The execution service is unavailable right now. Try again shortly." };
    const j = (await res.json()) as { stdout?: string; stderr?: string; compile_output?: string; time?: string | null; status?: { id?: number } };
    const id = j.status?.id ?? 0;
    const stdout = unb64(j.stdout).slice(0, 4000);
    const stderr = (unb64(j.stderr) || unb64(j.compile_output)).slice(0, 1500);
    const timeMs = Math.round(Number(j.time ?? 0) * 1000) || 0;
    const outcome = id === 3 ? "OK" : id === 5 ? "TIME_LIMIT" : id === 6 ? "COMPILE_ERROR" : stderr.toLowerCase().includes("memory") ? "MEMORY_LIMIT" : "RUNTIME_ERROR";
    return { ok: true, outcome, stdout, stderr, timeMs };
  } catch {
    return { ok: false, error: "The execution service didn't respond in time. Try again shortly." };
  }
}

const norm = (s: string) => s.replace(/\r\n/g, "\n").split("\n").map((l) => l.trimEnd()).join("\n").trim();
export const sameOutput = (got: string, expected: string) => norm(got) === norm(expected);
