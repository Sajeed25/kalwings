import { getSettings } from "@/lib/settings";

/** Platform-wide notice set by an admin under Site settings. Renders nothing when empty. */
export async function Announcement() {
  const { announcement } = await getSettings();
  if (!announcement) return null;
  return <div role="note" data-testid="announcement" className="bg-sun px-5 py-2.5 text-center text-sm font-semibold text-black">{announcement}</div>;
}
