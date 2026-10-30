"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { sendInChunks } from "@/lib/chunk-client";
import { MAX_VIDEO_BYTES, VIDEO_MAX_SECONDS } from "@/lib/file-limits";

type Phase = "idle" | "preview" | "countdown" | "recording" | "review" | "uploading";
const MIN_SECONDS = 10;
const TYPES = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];

/** Record a short selfie introduction in the browser: camera preview, 3-2-1 countdown, up to 60 seconds, watch it back, retake or save. */
export function IntroRecorder() {
  const router = useRouter();
  const live = useRef<HTMLVideoElement>(null), playback = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null), rec = useRef<MediaRecorder | null>(null), chunks = useRef<Blob[]>([]), timer = useRef<number | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>("idle"), [secs, setSecs] = useState(0), [count, setCount] = useState(3), [error, setError] = useState<string>(), [clip, setClip] = useState<{ blob: Blob; url: string }>(), [pct, setPct] = useState(0);
  const stop = () => { window.clearInterval(timer.current); stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; };
  useEffect(() => () => { stop(); }, []);
  useEffect(() => { if (clip) return () => URL.revokeObjectURL(clip.url); }, [clip]);

  async function openCamera() {
    setError(undefined);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setError("This browser can't record video. Try Chrome, Edge, Firefox or Safari 14.1 or newer."); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: true });
      stream.current = s; setPhase("preview");
      requestAnimationFrame(() => { if (live.current) { live.current.srcObject = s; void live.current.play().catch(() => {}); } });
    } catch { setError("We couldn't open your camera and microphone. Allow access in your browser's address bar, then try again."); }
  }
  function begin() {
    setPhase("countdown"); setCount(3); let n = 3;
    const t = window.setInterval(() => { n -= 1; if (n <= 0) { window.clearInterval(t); startRecording(); } else setCount(n); }, 1000);
  }
  function startRecording() {
    const s = stream.current; if (!s) return;
    const mimeType = TYPES.find((t) => MediaRecorder.isTypeSupported(t));
    const r = new MediaRecorder(s, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 700_000, audioBitsPerSecond: 64_000 });
    chunks.current = []; rec.current = r;
    r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
    r.onstop = () => { const blob = new Blob(chunks.current, { type: r.mimeType || "video/webm" }); stop(); setClip({ blob, url: URL.createObjectURL(blob) }); setPhase("review"); };
    r.start(1000); setSecs(0); setPhase("recording");
    let n = 0; timer.current = window.setInterval(() => { n += 1; setSecs(n); if (n >= VIDEO_MAX_SECONDS) finish(); }, 1000);
  }
  function finish() { window.clearInterval(timer.current); if (rec.current?.state === "recording") rec.current.stop(); }
  function retake() { setClip(undefined); setSecs(0); void openCamera(); }
  async function save() {
    if (!clip) return; setError(undefined);
    if (clip.blob.size > MAX_VIDEO_BYTES) { setError("That recording is too large. Record a shorter one."); return; }
    setPhase("uploading"); setPct(0);
    try {
      const { token, count: c } = await sendInChunks(clip.blob, setPct);
      const r = await fetch("/api/intro-video", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, count: c }) });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Upload failed");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); setPhase("review"); }
  }

  return (
    <div>
      {phase === "idle" && (
        <div>
          <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-ink-soft"><li>Say who you are and what you study.</li><li>Tell one project you are proud of and what you did.</li><li>Say what work you want next, and why.</li></ul>
          <Button type="button" onClick={openCamera}>Open camera</Button>
          <p className="mt-2 text-xs text-ink-soft">Up to {VIDEO_MAX_SECONDS} seconds. Nothing is uploaded until you press Save.</p>
        </div>
      )}
      {(phase === "preview" || phase === "countdown" || phase === "recording") && (
        <div>
          <div className="relative overflow-hidden rounded-2xl bg-black"><video ref={live} muted playsInline aria-label="Camera preview" className="aspect-[4/3] w-full -scale-x-100 object-cover" />
            {phase === "countdown" && <div role="status" aria-live="assertive" className="absolute inset-0 grid place-items-center bg-black/40 text-8xl font-extrabold text-white">{count}</div>}
            {phase === "recording" && <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white"><span className="h-3 w-3 animate-pulse rounded-full bg-red-500" aria-hidden /> Recording {secs}s / {VIDEO_MAX_SECONDS}s</div>}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {phase === "preview" && <Button type="button" onClick={begin}>Start recording</Button>}
            {phase === "recording" && <Button type="button" onClick={finish} disabled={secs < MIN_SECONDS}>{secs < MIN_SECONDS ? `Stop (available at ${MIN_SECONDS}s)` : "Stop"}</Button>}
            {phase !== "countdown" && <Button type="button" variant="secondary" onClick={() => { finish(); stop(); setPhase("idle"); }}>Cancel</Button>}
          </div>
        </div>
      )}
      {(phase === "review" || phase === "uploading") && clip && (
        <div>
          <video ref={playback} src={clip.url} controls playsInline aria-label="Your recording" className="aspect-[4/3] w-full rounded-2xl bg-black object-cover" />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={save} disabled={phase === "uploading"}>{phase === "uploading" ? `Saving ${Math.round(pct * 100)}%…` : "Save this video"}</Button>
            <Button type="button" variant="secondary" onClick={retake} disabled={phase === "uploading"}>Retake</Button>
            <span className="text-xs text-ink-soft">{(clip.blob.size / 1e6).toFixed(1)} MB</span>
          </div>
        </div>
      )}
      <div role="status" aria-live="polite">{error && <p role="alert" className="mt-3 text-sm font-medium text-danger">{error}</p>}</div>
    </div>
  );
}
