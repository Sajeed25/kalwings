/** Browser helper: sends a Blob to /api/upload/chunk in 500 KB pieces and returns the token to finish with /api/resume or /api/intro-video. */
const PIECE = 500_000;
const token = () => { const b = new Uint8Array(18); crypto.getRandomValues(b); return Array.from(b, (x) => "abcdefghijklmnopqrstuvwxyz0123456789"[x % 36]).join("") + "x7"; };

export async function sendInChunks(blob: Blob, onProgress?: (fraction: number) => void): Promise<{ token: string; count: number }> {
  const t = token(); const count = Math.max(1, Math.ceil(blob.size / PIECE));
  for (let i = 0; i < count; i++) {
    let sent = false, last = "Upload failed";
    for (let attempt = 0; attempt < 3 && !sent; attempt++) {
      try {
        const r = await fetch(`/api/upload/chunk?token=${t}&i=${i}`, { method: "POST", body: blob.slice(i * PIECE, (i + 1) * PIECE) });
        if (r.ok) sent = true; else { last = ((await r.json().catch(() => ({}))) as { error?: string }).error ?? last; if (r.status < 500) throw new Error(last); }
      } catch (e) { last = e instanceof Error ? e.message : last; if (/sign in|Only students|Too many|Bad origin/.test(last)) throw new Error(last); await new Promise((res) => setTimeout(res, 600 * (attempt + 1))); }
    }
    if (!sent) throw new Error(last);
    onProgress?.((i + 1) / count);
  }
  return { token: t, count };
}
