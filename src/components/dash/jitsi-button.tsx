"use client";
/** Fills the nearest "Link, phone or address" field with a fresh Jitsi Meet room (free, no account). The room name is random, so only people given the link can find it. */
export function JitsiButton() {
  return (
    <button type="button" className="text-xs font-semibold text-accent underline"
      onClick={(e) => {
        const form = e.currentTarget.closest("form"); const input = form?.querySelector<HTMLInputElement>('input[name="detail"]'); if (!input) return;
        const b = new Uint8Array(9); crypto.getRandomValues(b);
        const room = Array.from(b, (x) => "abcdefghijklmnopqrstuvwxyz0123456789"[x % 36]).join("");
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set; set?.call(input, `https://meet.jit.si/kalwings-${room}`); input.dispatchEvent(new Event("input", { bubbles: true }));
        const mode = form?.querySelector<HTMLSelectElement>('select[name="mode"]'); if (mode) mode.value = "VIDEO";
      }}>Create a free video room</button>
  );
}
