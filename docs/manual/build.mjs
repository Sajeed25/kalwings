// Builds KALWINGS-Manual.pdf from content-a.mjs (staff guide) and content-b.mjs (developer reference).
// Usage:  node docs/manual/build.mjs        (screenshots come from `node docs/manual/shots.mjs`, see the manual's own chapter B15)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { partA } from './content-a.mjs';
import { partB } from './content-b.mjs';

const DIR = new URL('./', import.meta.url).pathname;
const OUT_PDF = new URL('../KALWINGS-Manual.pdf', import.meta.url).pathname;
const VERSION = process.env.MANUAL_VERSION ?? '1.0';
const DATE = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

function assemble(pageNumbers = {}) {
  let figN = 0; const figures = []; const toc = [];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const h = {
    part: (id, title, intro = '') => { toc.push({ lvl: 0, id, title }); return `<section class="part-break" id="${id}"><div class="part-label">${id.replace('part-', 'Part ').toUpperCase()}</div><h1 class="part">${title}</h1><p class="part-intro">${intro}</p></section>`; },
    h2: (num, title) => { const id = `s-${num}`; toc.push({ lvl: 1, id, title: `${num}  ${title}` }); return `<h2 id="${id}"><span class="num">${num}</span> ${title}</h2>`; },
    h3: (title) => `<h3>${title}</h3>`,
    p: (t) => `<p>${t}</p>`,
    ul: (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`,
    ol: (items) => `<ol class="steps">${items.map((i) => `<li>${i}</li>`).join('')}</ol>`,
    note: (t) => `<div class="callout note"><b>Note.</b> ${t}</div>`,
    tip: (t) => `<div class="callout tip"><b>Tip.</b> ${t}</div>`,
    warn: (t) => `<div class="callout warn"><b>Careful.</b> ${t}</div>`,
    rule: (t) => `<div class="callout rule"><b>Platform rule.</b> ${t}</div>`,
    code: (t, lang = '') => `<pre class="code ${lang}"><code>${esc(t)}</code></pre>`,
    table: (head, rows, cls = '') => `<table class="${cls}"><thead><tr>${head.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
    fig: (id, title, legend = []) => {
      figN++; const n = figN; figures.push({ n, id, title, anchor: `fig-${n}` });
      return `<figure id="fig-${n}"><img src="img/${id}.png" alt="${esc(title)}"><figcaption><b>Figure ${n}.</b> ${title}</figcaption>${legend.length ? `<ol class="legend">${legend.map((l, i) => `<li value="${i + 1}">${l}</li>`).join('')}</ol>` : ''}</figure>`;
    },
    kbd: (t) => `<kbd>${t}</kbd>`,
  };
  const body = [partA(h), partB(h)].join('\n');
  const pn = (id) => (pageNumbers[id] ? `<span class="pn">${pageNumbers[id]}</span>` : '<span class="pn">·</span>');
  const tocHtml = toc.map((t) => `<div class="toc l${t.lvl}"><a href="#${t.id}">${t.title}</a><span class="dots"></span>${pn(t.id)}</div>`).join('');
  const figHtml = figures.map((f) => `<div class="toc l1"><a href="#${f.anchor}">Figure ${f.n}. ${f.title}</a><span class="dots"></span>${pn(f.anchor)}</div>`).join('');
  const css = fs.readFileSync(DIR + 'manual.css', 'utf8');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Kalwings Platform Manual</title><style>${css}</style></head><body>
<section class="cover"><div class="cover-top"><div class="brand-k">K</div><div class="brand-w">ALWINGS</div></div>
<div class="cover-main"><div class="cover-eyebrow">Platform manual</div><h1>Run it. Support it.<br><em>Build on it.</em></h1>
<p class="cover-sub">Staff guide for admins and support, and developer reference for the team that maintains app.kalwings.com.</p></div>
<div class="cover-foot"><div><b>Version</b> ${VERSION}</div><div><b>Date</b> ${DATE}</div><div><b>Audience</b> Admins, support staff, developers</div><div><b>Product</b> app.kalwings.com · Robokalam Technologies</div></div></section>
<section class="front"><h1 class="toc-title">Contents</h1>${tocHtml}<h1 class="toc-title fig">Figures</h1>${figHtml}</section>
${body}
</body></html>`;
  return { html, toc, figures };
}

async function render(html, file) {
  fs.writeFileSync(DIR + 'manual.html', html);
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage();
  await p.goto('file://' + DIR + 'manual.html', { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: file, format: 'A4', printBackground: true, margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' }, displayHeaderFooter: true,
    headerTemplate: `<div style="font:8px Inter,Arial;color:#888;width:100%;padding:0 16mm;display:flex;justify-content:space-between"><span>Kalwings Platform Manual</span><span>v${VERSION}</span></div>`,
    footerTemplate: `<div style="font:8px Inter,Arial;color:#888;width:100%;padding:0 16mm;display:flex;justify-content:space-between"><span>Internal: share with staff only</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>` });
  await b.close();
}

// pass 1: render without page numbers, find each heading's page, pass 2: render with them
const first = assemble();
await render(first.html, OUT_PDF);
const pages = Number(execFileSync('pdfinfo', [OUT_PDF]).toString().match(/Pages:\s+(\d+)/)[1]);
const texts = [];
for (let i = 1; i <= pages; i++) texts.push(execFileSync('pdftotext', ['-f', String(i), '-l', String(i), '-layout', OUT_PDF, '-']).toString());
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const nums = {};
const startPage = texts.findIndex((t) => /Part A/i.test(t) && !/Contents/.test(t)) + 1 || 1;
for (const t of first.toc) {
  const needle = norm(t.title);
  for (let i = startPage - 1; i < pages; i++) if (norm(texts[i]).includes(needle)) { nums[t.id] = i + 1; break; }
}
for (const f of first.figures) {
  const needle = `Figure ${f.n}. ${norm(f.title)}`;
  for (let i = startPage - 1; i < pages; i++) if (norm(texts[i]).includes(needle.slice(0, 40))) { nums[f.anchor] = i + 1; break; }
}
const second = assemble(nums);
await render(second.html, OUT_PDF);
const pages2 = Number(execFileSync('pdfinfo', [OUT_PDF]).toString().match(/Pages:\s+(\d+)/)[1]);
console.log(`Wrote ${OUT_PDF}: ${pages2} pages, ${second.figures.length} figures, ${Object.keys(nums).length}/${second.toc.length + second.figures.length} page numbers resolved`);
