# Platform manual (PDF)

`docs/KALWINGS-Manual.pdf` is the staff guide (Part A) and developer reference (Part B). It is generated; edit the sources, not the PDF.

| File | Purpose |
| --- | --- |
| `content-a.mjs` | Part A, staff guide (plain language, step by step) |
| `content-b.mjs` | Part B, developer reference; its appendices are generated from the source tree |
| `manual.css` | Print styling |
| `shots.mjs` | Takes the annotated screenshots (numbered red callouts) into `img/` (not committed) |
| `build.mjs` | Assembles the HTML and writes the PDF with page numbers in the contents |

Rebuild after a UI or feature change:

1. Clean database, migrate and seed (`npm run db:seed`), start `npm run dev -- -p 3000` with `ADMIN_EMAILS` empty.
2. `CHROMIUM_PATH=/path/to/chrome node docs/manual/shots.mjs` (needs a fresh seed: it creates demo records such as "Demo Company Pvt Ltd").
3. `CHROMIUM_PATH=/path/to/chrome node docs/manual/build.mjs`.

Screenshots show demo data only. Keep it that way: never put real people's details in the manual.
