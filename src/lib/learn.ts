/** Curated free places to learn a skill. Only well-known free sources; no tracking, no affiliate links. Links open in a new tab. */
export type Resource = { label: string; url: string };
const R: [RegExp, Resource[]][] = [
  [/^python$/i, [{ label: "Python for Everybody (free course)", url: "https://www.py4e.com/" }, { label: "Official Python tutorial", url: "https://docs.python.org/3/tutorial/" }]],
  [/^java$|^spring( boot)?$/i, [{ label: "Learn Java (dev.java)", url: "https://dev.java/learn/" }, { label: "Spring guides", url: "https://spring.io/guides" }]],
  [/^javascript$|^js$/i, [{ label: "JavaScript on MDN", url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript" }, { label: "The Modern JavaScript Tutorial", url: "https://javascript.info/" }]],
  [/^typescript$/i, [{ label: "TypeScript documentation", url: "https://www.typescriptlang.org/docs/" }]],
  [/^react$/i, [{ label: "Learn React (react.dev)", url: "https://react.dev/learn" }]],
  [/^node(\.js|js)?$/i, [{ label: "Learn Node.js", url: "https://nodejs.org/en/learn" }]],
  [/^html$|^css$|^web$/i, [{ label: "Learn web development (MDN)", url: "https://developer.mozilla.org/en-US/docs/Learn" }, { label: "freeCodeCamp", url: "https://www.freecodecamp.org/learn" }]],
  [/^sql$|^mysql$|^postgres(ql)?$/i, [{ label: "SQLBolt: interactive SQL lessons", url: "https://sqlbolt.com/" }, { label: "Kaggle Learn: SQL", url: "https://www.kaggle.com/learn" }]],
  [/^git$|^github$/i, [{ label: "Pro Git (free book)", url: "https://git-scm.com/book/en/v2" }]],
  [/^docker$/i, [{ label: "Docker: get started", url: "https://docs.docker.com/get-started/" }]],
  [/^(machine learning|ml|deep learning|ai|data science|analytics|data viz|data)$/i, [{ label: "Kaggle Learn (free micro-courses)", url: "https://www.kaggle.com/learn" }, { label: "fast.ai: practical deep learning", url: "https://course.fast.ai/" }]],
  [/^(c|c\+\+|embedded c|embedded|iot|robotics)$/i, [{ label: "Beej's Guide to C", url: "https://beej.us/guide/bgc/" }, { label: "NPTEL (free IIT courses)", url: "https://nptel.ac.in/" }]],
  [/^(dsa|algorithms|data structures|computer science|cs)$/i, [{ label: "CS50 (free Harvard course)", url: "https://cs50.harvard.edu/x/" }, { label: "NPTEL (free IIT courses)", url: "https://nptel.ac.in/" }]],
];
export const FALLBACK: Resource[] = [{ label: "freeCodeCamp", url: "https://www.freecodecamp.org/learn" }, { label: "NPTEL (free IIT courses)", url: "https://nptel.ac.in/" }];

export function learningLinks(skill: string, fallback = false): Resource[] {
  const k = skill.trim();
  for (const [re, links] of R) if (re.test(k)) return links;
  return fallback ? FALLBACK : [];
}
