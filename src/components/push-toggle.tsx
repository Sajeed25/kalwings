"use client";
import { useEffect, useState, useTransition } from "react";
import { sendTestPush } from "@/app/actions/push";

type State = "loading" | "unsupported" | "unavailable" | "blocked" | "off" | "on";
const b64 = (s: string) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const raw = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(raw, (c) => c.charCodeAt(0)); };

/** Turn push notifications on or off for this device (Settings). Needs the live, installed-or-browser site: the service worker is only registered in production. */
export function PushToggle() {
  const [state, setState] = useState<State>("loading"), [msg, setMsg] = useState<string>(), [busy, startBusy] = useTransition();
  const reg = async () => (await navigator.serviceWorker.getRegistration()) ?? null;
  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      if (Notification.permission === "denied") return setState("blocked");
      const r = await reg(); if (!r) return setState("unavailable");
      setState((await r.pushManager.getSubscription()) ? "on" : "off");
    })().catch(() => setState("unavailable"));
  }, []);
  async function enable() {
    setMsg(undefined);
    try {
      const r = await reg(); if (!r) return setState("unavailable");
      if ((await Notification.requestPermission()) !== "granted") return setState(Notification.permission === "denied" ? "blocked" : "off");
      const k = await fetch("/api/push/key"); const { key } = (await k.json()) as { key?: string }; if (!k.ok || !key) throw new Error("Push is unavailable right now.");
      const sub = (await r.pushManager.getSubscription()) ?? (await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) }));
      const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!res.ok) { await sub.unsubscribe(); throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Could not turn notifications on."); }
      setState("on");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not turn notifications on."); }
  }
  async function disable() {
    try { const r = await reg(); const sub = await r?.pushManager.getSubscription(); if (sub) { await fetch("/api/push/unsubscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }); await sub.unsubscribe(); } setState("off"); } catch { setMsg("Could not turn them off. Try again."); }
  }
  const btn = "inline-flex h-10 items-center rounded-full border border-line px-5 text-sm font-semibold hover:border-accent";
  if (state === "loading") return <p className="text-sm text-ink-soft">Checking this device…</p>;
  if (state === "unsupported") return <p className="text-sm text-ink-soft">This browser cannot show push notifications. On iPhone, add Kalwings to the Home Screen first (iOS 16.4 or newer), then come back here.</p>;
  if (state === "unavailable") return <p className="text-sm text-ink-soft">Notifications switch on once the app has loaded on the live site. Reload this page, or open the installed app.</p>;
  if (state === "blocked") return <p className="text-sm text-ink-soft">Notifications are blocked for this site. Allow them in your browser&apos;s site settings, then reload.</p>;
  return (
    <div>
      <p className="text-sm text-ink-soft">{state === "on" ? "On for this device: new matches, replies and interview updates appear even when Kalwings is closed." : "Get new matches, replies and interview updates on this device, even when Kalwings is closed. Free, and you can turn it off any time."}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {state === "off" ? <button type="button" className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-on-primary" onClick={enable}>Turn on notifications</button> : <><button type="button" className={btn} onClick={disable}>Turn off</button><button type="button" className={btn} disabled={busy} onClick={() => startBusy(async () => { const r = await sendTestPush(); setMsg(r.ok ? r.note : r.error); })}>Send a test</button></>}
      </div>
      <div role="status" aria-live="polite">{msg && <p className="mt-2 text-sm text-ink-soft">{msg}</p>}</div>
    </div>
  );
}
