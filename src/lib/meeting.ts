import { randomBytes } from "node:crypto";
/** A fresh Jitsi Meet room: free, open source, no account or key. The name is random so it cannot be guessed. */
export const jitsiRoom = () => `https://meet.jit.si/kalwings-${randomBytes(9).toString("base64url").replace(/[-_]/g, "x").toLowerCase()}`;
