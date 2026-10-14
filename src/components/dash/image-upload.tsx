"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/** Picks an image, downscales it in the browser (canvas → JPEG), uploads it, then refreshes the page. */
export function ImageUpload({ kind, projectId, companyId, mentorId, currentUrl, label, maxDim = 1024, round }: { kind: "AVATAR" | "PROJECT" | "COMPANY_LOGO"; projectId?: string; companyId?: string; mentorId?: string; currentUrl?: string | null; label: string; maxDim?: number; round?: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function shrink(file: File): Promise<Blob> {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); // JPEG has no transparency
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not process image"))), "image/jpeg", 0.85));
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(undefined); setBusy(true);
    try {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("Choose a PNG, JPEG or WebP image");
      const blob = await shrink(file);
      const fd = new FormData();
      fd.set("file", blob, "image.jpg"); fd.set("kind", kind); if (projectId) fd.set("projectId", projectId); if (companyId) fd.set("companyId", companyId); if (mentorId) fd.set("mentorId", mentorId);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentUrl} alt="" className={`h-20 w-20 shrink-0 object-cover ${round ? "rounded-full" : "rounded-xl"}`} width={80} height={80} />
      ) : (
        <div aria-hidden className={`placeholder-img h-20 w-20 shrink-0 ${round ? "rounded-full" : "rounded-xl"}`} />
      )}
      <div>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onPick} aria-label={label} />
        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Uploading…" : currentUrl ? `Change ${label.toLowerCase()}` : label}</Button>
        <p className="mt-1 text-xs text-ink-soft">PNG, JPEG or WebP. Resized automatically.</p>
        {error && <p role="alert" className="mt-1 text-sm font-medium text-danger">{error}</p>}
      </div>
    </div>
  );
}
