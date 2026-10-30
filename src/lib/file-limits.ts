/** Limits shared by the browser (for early, friendly checks) and the server (which enforces them). */
export const MAX_RESUME_BYTES = 2_000_000; // the same ceiling Indian job sites use (about 2 MB)
export const MAX_VIDEO_BYTES = 8_000_000;
export const VIDEO_MAX_SECONDS = 60;
export const RESUME_FORMATS = "PDF, DOC, DOCX or RTF";
