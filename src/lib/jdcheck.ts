export type JdFlag = { level: "block" | "warn" | "tip"; text: string };

/** Checks a job description for things that hurt candidates or break Kalwings rules. Pure text rules; it changes nothing. */
export function checkJobDescription(text: string): JdFlag[] {
  const t = text.trim(), lower = t.toLowerCase(), words = t.split(/\s+/).filter(Boolean).length;
  const f: JdFlag[] = [];
  if (/registration fee|security deposit|training fee|processing fee|refundable|pay (a )?fee|buy (a )?(kit|laptop)|deposit/.test(lower)) f.push({ level: "block", text: "Asking candidates to pay anything is a scam signal and isn't allowed on Kalwings." });
  if (/guarantee[sd]? (a )?(job|placement|selection|offer)|100% (job|placement)/.test(lower)) f.push({ level: "block", text: "Don't promise guaranteed jobs or placements." });
  if (/whatsapp|telegram|@gmail\.com|@yahoo\.com|@outlook\.com|\bcall (me )?\+?\d{8,}/.test(lower)) f.push({ level: "warn", text: "Moving candidates to WhatsApp, Telegram or a personal email looks suspicious. Use Kalwings messages." });
  if (/\b(males? only|females? only|boys only|girls only|age (below|under|between|limit)|fair complexion|native (english )?speaker)\b/.test(lower)) f.push({ level: "warn", text: "This wording may exclude people unfairly. State the skills you need instead." });
  if (/\b(rockstar|ninja|guru|wizard)\b/.test(lower)) f.push({ level: "tip", text: "Replace words like “rockstar” or “ninja” with the actual work and skills." });
  if (words < 60) f.push({ level: "warn", text: `Only ${words} words. Describe the work, the team and how selection works (aim for 100 to 300 words).` });
  if (!/responsibilit|what you.?ll (do|work)|you will (build|work|help|own|write|design)/.test(lower)) f.push({ level: "tip", text: "Add a short “what you'll do” section so candidates understand the day-to-day." });
  if (!/requirement|qualif|you (have|bring)|looking for|skills? (we|you)|must have|should have/.test(lower)) f.push({ level: "tip", text: "Say what you actually need (skills, tools, knowledge) and what you'd teach on the job." });
  if (!/interview|selection|process|round|assignment|shortlist/.test(lower)) f.push({ level: "tip", text: "Explain how selection works (rounds, assignment, timeline). Freshers value this." });
  if (!f.length) f.push({ level: "tip", text: "No problems found. Still re-read it as a first-year graduate would." });
  return f;
}
