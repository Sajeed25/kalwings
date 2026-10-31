"use client";
import { useEffect, useState } from "react";
import { LANGS, isLang, tr, type Lang } from "@/lib/i18n";

const EVENT = "kw-lang";
const read = (): Lang => { try { const m = document.cookie.match(/(?:^|; )kw_lang=([a-z]{2})/); return m && isLang(m[1]) ? m[1] : "en"; } catch { return "en"; } };

/** The chosen language, read from a plain preference cookie after load (so pages stay cacheable). Also sets the page's lang attribute. */
export function useLang(): Lang {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const sync = () => { const l = read(); setLang(l); document.documentElement.lang = LANGS.find((x) => x.code === l)!.html; };
    sync(); window.addEventListener(EVENT, sync); return () => window.removeEventListener(EVENT, sync);
  }, []);
  return lang;
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const lang = useLang();
  return (
    <label className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <span>{tr(lang, "lang.label")}</span>
      <select value={lang} aria-describedby="lang-note" className="h-9 rounded-lg border border-line bg-surface px-2 text-ink"
        onChange={(e) => { const v = e.target.value; if (!isLang(v)) return; try { document.cookie = `kw_lang=${v}; path=/; max-age=31536000; samesite=lax`; } catch { /* cookies blocked: stays English */ } window.dispatchEvent(new Event(EVENT)); }}>
        {LANGS.map((l) => <option key={l.code} value={l.code} lang={l.code}>{l.name}</option>)}
      </select>
      <span id="lang-note" className="sr-only">{tr(lang, "lang.note")}</span>
    </label>
  );
}
