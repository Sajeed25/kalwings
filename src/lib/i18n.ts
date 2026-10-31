/** Regional languages (beta). Covers the header, footer and language picker; every other page stays in English and says so. Missing keys fall back to English. */
export const LANGS = [{ code: "en", name: "English", html: "en-IN" }, { code: "hi", name: "हिन्दी", html: "hi-IN" }, { code: "te", name: "తెలుగు", html: "te-IN" }] as const;
export type Lang = (typeof LANGS)[number]["code"];
export const isLang = (v: unknown): v is Lang => LANGS.some((l) => l.code === v);

const en = {
  "nav.opportunities": "Opportunities", "nav.challenges": "Challenges", "nav.events": "Events", "nav.mentors": "Mentors", "nav.community": "Community",
  "auth.login": "Log in", "auth.join": "Create account", "auth.workspace": "Workspace",
  "foot.privacy": "Privacy", "foot.terms": "Terms", "foot.trust": "Trust & Safety", "foot.help": "Help", "foot.contact": "Contact",
  "lang.label": "Language", "lang.note": "Beta: menus and footer are translated. Other pages are in English.",
};
type Key = keyof typeof en;
const hi: Partial<Record<Key, string>> = {
  "nav.opportunities": "अवसर", "nav.challenges": "चुनौतियाँ", "nav.events": "कार्यक्रम", "nav.mentors": "मेंटर", "nav.community": "समुदाय",
  "auth.login": "लॉग इन", "auth.join": "खाता बनाएँ", "auth.workspace": "वर्कस्पेस",
  "foot.privacy": "गोपनीयता", "foot.terms": "शर्तें", "foot.trust": "भरोसा और सुरक्षा", "foot.help": "सहायता", "foot.contact": "संपर्क",
  "lang.label": "भाषा", "lang.note": "बीटा: मेन्यू और फ़ुटर अनुवादित हैं। बाकी पेज अंग्रेज़ी में हैं।",
};
const te: Partial<Record<Key, string>> = {
  "nav.opportunities": "అవకాశాలు", "nav.challenges": "ఛాలెంజ్‌లు", "nav.events": "ఈవెంట్‌లు", "nav.mentors": "మెంటార్లు", "nav.community": "సంఘం",
  "auth.login": "లాగిన్", "auth.join": "ఖాతా సృష్టించండి", "auth.workspace": "వర్క్‌స్పేస్",
  "foot.privacy": "గోప్యత", "foot.terms": "నిబంధనలు", "foot.trust": "నమ్మకం & భద్రత", "foot.help": "సహాయం", "foot.contact": "సంప్రదించండి",
  "lang.label": "భాష", "lang.note": "బీటా: మెనూలు, ఫుటర్ అనువదించబడ్డాయి. ఇతర పేజీలు ఆంగ్లంలో ఉన్నాయి.",
};
const dict: Record<Lang, Partial<Record<Key, string>>> = { en, hi, te };
export const tr = (lang: Lang, key: Key): string => dict[lang][key] ?? en[key];
export const NAV_KEY: Record<string, Key> = { "/opportunities": "nav.opportunities", "/challenges": "nav.challenges", "/events": "nav.events", "/mentors": "nav.mentors", "/community": "nav.community" };
