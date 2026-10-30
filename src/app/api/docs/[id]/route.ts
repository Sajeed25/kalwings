import { db } from "@/lib/db";
import { getUser } from "@/lib/session";

/**
 * Private files: resumes and intro videos. Never public and never cached by shared caches. Allowed for the owner, for platform admins, and for a
 * member of a verified company that received the file on an application (the candidate chose to attach it).
 * Videos support Range requests so they can be played and scrubbed.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return new Response("Please sign in", { status: 401 });
  const f = await db.upload.findFirst({ where: { id, kind: { in: ["RESUME", "INTRO_VIDEO"] } }, select: { kind: true, mime: true, name: true, data: true, ownerId: true } });
  if (!f) return new Response("Not found", { status: 404 });
  let ok = user.id === f.ownerId || user.role === "PLATFORM_ADMIN";
  if (!ok && user.role === "EMPLOYER") {
    ok = (await db.application.count({
      where: { ...(f.kind === "RESUME" ? { resumeId: id } : { introVideoId: id }), opportunity: { company: { status: "VERIFIED", members: { some: { userId: user.id } } } } },
    })) > 0;
  }
  if (!ok) return new Response("Not found", { status: 404 });

  const base = { "Content-Type": f.mime, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store", "Content-Security-Policy": "sandbox; default-src 'none'" };
  if (f.kind === "RESUME") {
    const n = f.name ?? "resume";
    return new Response(new Uint8Array(f.data), { headers: { ...base, "Content-Length": String(f.data.length), "Content-Disposition": `attachment; filename="${n.replace(/[^A-Za-z0-9._ ()-]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(n)}` } });
  }
  const size = f.data.length; const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2])); let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    end = Math.min(end, size - 1);
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(new Uint8Array(f.data.subarray(start, end + 1)), { status: 206, headers: { ...base, "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1), "Content-Disposition": "inline" } });
  }
  return new Response(new Uint8Array(f.data), { headers: { ...base, "Accept-Ranges": "bytes", "Content-Length": String(size), "Content-Disposition": "inline" } });
}
