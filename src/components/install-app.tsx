"use client";
import { useEffect, useState } from "react";

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/**
 * Install Kalwings as an app. Android and desktop Chrome or Edge show a real install button. iPhone and iPad have no install button, so we show
 * the two taps. Hidden once installed. Nothing is stored and nothing is sent anywhere.
 */
export function InstallApp({ compact = false }: { compact?: boolean }) {
  const [evt, setEvt] = useState<Prompt | null>(null), [installed, setInstalled] = useState(false), [ios, setIos] = useState(false), [ready, setReady] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone); setReady(true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent));
    const on = (e: Event) => { e.preventDefault(); setEvt(e as Prompt); };
    const done = () => { setInstalled(true); setEvt(null); };
    window.addEventListener("beforeinstallprompt", on); window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", on); window.removeEventListener("appinstalled", done); };
  }, []);
  if (!ready) return null;
  if (installed) return compact ? null : <p className="text-sm text-ink-soft">Kalwings is installed on this device. Open it from your home screen or app list.</p>;
  if (evt) return <button type="button" onClick={async () => { await evt.prompt(); await evt.userChoice.catch(() => null); setEvt(null); }} className={compact ? "font-semibold text-accent underline" : "inline-flex h-11 items-center rounded-full bg-primary px-6 font-bold text-on-primary"}>Install the app</button>;
  if (ios) return <details className="text-sm"><summary className="cursor-pointer font-semibold text-accent">Install on iPhone or iPad</summary><ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-soft"><li>Tap the Share button in Safari.</li><li>Choose “Add to Home Screen”, then Add.</li></ol></details>;
  return compact ? null : <p className="text-sm text-ink-soft">To install, open this page in Chrome or Edge on Android or a computer, or in Safari on iPhone, and look for “Install” in the address bar or the browser menu.</p>;
}
