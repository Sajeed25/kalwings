/** Resume and intro-video checks. Pure functions (no server-only import) so the unit tests can run them. */
export * from "./file-limits";

export type ResumeKind = { mime: string; ext: "pdf" | "doc" | "docx" | "rtf" };

const has = (b: Uint8Array, s: string, enc: "latin1" | "utf16le" = "latin1") => Buffer.from(b).includes(Buffer.from(s, enc));
const starts = (b: Uint8Array, s: string) => b.length >= s.length && Buffer.from(b.subarray(0, s.length)).toString("latin1") === s;

/**
 * Identify a resume by its magic bytes, ignoring the client-supplied name and type. Only PDF, DOC, DOCX and RTF are accepted, and files that
 * carry macros, embedded objects or script are refused. The file is only ever served back as a download, never opened by the server.
 */
export function sniffResume(b: Uint8Array): ResumeKind | null {
  if (b.length < 64) return null;
  if (starts(b, "%PDF-")) return has(b, "/JavaScript") || has(b, "/Launch") || has(b, "/EmbeddedFile") ? null : { mime: "application/pdf", ext: "pdf" };
  if (starts(b, "{\\rtf")) return has(b, "\\objdata") ? null : { mime: "application/rtf", ext: "rtf" };
  if (b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0 && b[4] === 0xa1 && b[5] === 0xb1 && b[6] === 0x1a && b[7] === 0xe1) {
    return has(b, "VBA", "utf16le") || has(b, "Macros", "utf16le") ? null : { mime: "application/msword", ext: "doc" };
  }
  if (b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) {
    if (!has(b, "word/document.xml")) return null; // some other zip
    if (has(b, "vbaProject.bin") || has(b, "word/embeddings/")) return null;
    return { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ext: "docx" };
  }
  return null;
}

/** WebM (Chrome, Firefox, Edge) or MP4 (Safari) recordings from the browser's MediaRecorder. */
export function sniffVideo(b: Uint8Array): "video/webm" | "video/mp4" | null {
  if (b.length < 1024) return null;
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "video/webm";
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return "video/mp4";
  return null;
}

/** A download name that is safe in a header and always ends in the real extension. */
export function safeFileName(original: string, ext: string, fallback = "resume"): string {
  const base = original.replace(/^.*[\\/]/, "").replace(/\.[A-Za-z0-9]{1,5}$/, "").replace(/[^A-Za-z0-9 ._()-]+/g, "").replace(/\s+/g, " ").trim().slice(0, 100);
  return `${base || fallback}.${ext}`;
}
