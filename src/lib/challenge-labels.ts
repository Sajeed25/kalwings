export const KIND_LABEL = {
  CODING: "Coding", SOFTWARE: "Software project", DATA_SQL: "Data / SQL", DESIGN: "UI/UX design", BUSINESS_CASE: "Business case",
  MARKETING: "Digital marketing", HARDWARE_IOT: "Robotics / electronics / IoT", RESEARCH: "Research", OTHER: "Other",
} as const;
export const STYLE_LABEL = { COMPETITIVE: "Competitive", COLLABORATIVE: "Collaborative", PORTFOLIO: "Portfolio" } as const;
export const STYLE_HELP = {
  COMPETITIVE: "Entries are compared and the strongest are shortlisted.",
  COLLABORATIVE: "Work together; every solid contribution is considered.",
  PORTFOLIO: "Build something for your portfolio; reviewed on its own merits, not ranked against others.",
} as const;
