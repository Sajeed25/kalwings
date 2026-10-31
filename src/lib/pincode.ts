/** India Post PIN lookup helpers (pure, unit tested). The service itself is called on the server only (see /api/pincode/[pin]). */
export const validPin = (s: string) => /^[1-9][0-9]{5}$/.test(s);
export type PinPlace = { district: string; area: string; state: string };

/** Reads the India Post response: [{ Status, PostOffice: [{ Name, District, State }] }]. Returns null when the PIN is unknown or the shape is unexpected. */
export function parsePin(data: unknown): PinPlace | null {
  const first = Array.isArray(data) ? data[0] : null;
  if (!first || first.Status !== "Success" || !Array.isArray(first.PostOffice) || !first.PostOffice.length) return null;
  const po = first.PostOffice[0] as { Name?: unknown; District?: unknown; State?: unknown };
  const clean = (v: unknown) => (typeof v === "string" ? v.replace(/[^\p{L}\p{N} .,'()-]/gu, "").trim().slice(0, 60) : "");
  const district = clean(po.District);
  return district ? { district, area: clean(po.Name), state: clean(po.State) } : null;
}
