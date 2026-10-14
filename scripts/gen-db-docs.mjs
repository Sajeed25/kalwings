#!/usr/bin/env node
// Generates docs/DATABASE.md from prisma/schema.prisma so the data-model docs never drift from the schema.  npm run docs:db
import { readFileSync, writeFileSync } from "node:fs";
const src = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const enums = [...src.matchAll(/^enum (\w+) \{\n(.*?)\n\}$/gms)].map(([, n, b]) => [n, b.split("\n").map((l) => l.trim()).filter(Boolean)]);
const models = [...src.matchAll(/^((?:\/\/[^\n]*\n)*)model (\w+) \{\n(.*?)\n\}$/gms)].map(([, c, n, b]) => {
  const lines = b.split("\n").map((l) => l.trim()).filter(Boolean);
  const fields = [], attrs = [];
  for (const l of lines) {
    if (l.startsWith("@@")) { attrs.push(l); continue; }
    if (l.startsWith("//")) continue;
    const m = l.match(/^(\w+)\s+([\w\[\]?]+)\s*(.*)$/); if (!m) continue;
    const [, name, type, rest] = m; const note = (rest.match(/\/\/\s*(.*)$/) || [])[1] ?? "";
    fields.push({ name, type, rest: rest.replace(/\/\/.*$/, "").trim(), note });
  }
  return { n, comment: c.replace(/^\/\/ ?/gm, "").trim(), fields, attrs };
});
const isRel = (f, names) => names.has(f.type.replace(/[\[\]?]/g, ""));
const names = new Set(models.map((m) => m.n));
let md = `# Database reference\n\nGenerated from \`prisma/schema.prisma\` by \`npm run docs:db\`. Do not edit by hand.\n\nMySQL 8 / MariaDB 10.6+. Lists (skills, tags) are stored as JSON and read with \`asList()\`. Long text is \`TEXT\`; uploaded images are \`LONGBLOB\`. Timestamps are UTC. Cascade rules are shown per relation.\n\n## Models (${models.length})\n\n| Model | Purpose / notes | Relations |\n| --- | --- | --- |\n`;
for (const m of models) md += `| [${m.n}](#${m.n.toLowerCase()}) | ${m.comment.split("\n")[0] || ""} | ${m.fields.filter((f) => isRel(f, names)).map((f) => f.name).join(", ")} |\n`;
for (const m of models) {
  md += `\n### ${m.n}\n\n${m.comment ? m.comment + "\n\n" : ""}| Field | Type | Constraints | Note |\n| --- | --- | --- | --- |\n`;
  for (const f of m.fields) md += `| ${f.name} | ${f.type} | ${f.rest.replace(/\|/g, "\\|")} | ${f.note} |\n`;
  if (m.attrs.length) md += `\nIndexes and constraints: ${m.attrs.map((a) => "`" + a + "`").join(", ")}\n`;
}
md += `\n## Enums\n\n`;
for (const [n, vals] of enums) md += `- **${n}**: ${vals.join(", ")}\n`;
writeFileSync(new URL("../docs/DATABASE.md", import.meta.url), md);
console.log(`docs/DATABASE.md: ${models.length} models, ${enums.length} enums`);
