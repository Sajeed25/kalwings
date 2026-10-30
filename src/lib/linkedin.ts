/** "Add to LinkedIn" link for a verified skill. LinkedIn's public add-certification form opens pre-filled; the student chooses whether to save it. */
export function linkedinAddUrl(o: { name: string; certUrl: string; certId: string; date: Date }): string {
  const q = new URLSearchParams({ startTask: "CERTIFICATION_NAME", name: o.name.slice(0, 100), organizationName: "Kalwings", issueYear: String(o.date.getUTCFullYear()), issueMonth: String(o.date.getUTCMonth() + 1), certUrl: o.certUrl, certId: o.certId.slice(0, 60) });
  return `https://www.linkedin.com/profile/add?${q.toString()}`;
}
