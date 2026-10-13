import { db } from "@/lib/db";

/** Serves an uploaded profile photo / project screenshot. IDs are unguessable and change on replacement, so responses are cached forever. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await db.upload.findUnique({ where: { id }, select: { mime: true, data: true } });
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(f.data), {
    headers: {
      "Content-Type": f.mime,
      "Content-Length": String(f.data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
