export const TYPE_LABEL = {
  INTERNSHIP: "Internship",
  JOB: "Fresher job",
  GRADUATE_TRAINEE: "Graduate trainee",
  APPRENTICESHIP: "Apprenticeship",
  CAMPUS: "Campus hiring",
  FREELANCE: "Freelance / project",
  CHALLENGE: "Challenge",
} as const;
export type OppTypeKey = keyof typeof TYPE_LABEL;
export const TYPE_KEYS = Object.keys(TYPE_LABEL) as [OppTypeKey, ...OppTypeKey[]];
