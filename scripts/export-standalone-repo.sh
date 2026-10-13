#!/usr/bin/env bash
# Creates a clean, standalone git repo of the Kalwings app (app at the repo root, CI/CD paths fixed).
# Recommended before connecting Hostinger: it deploys a repo root far more simply than a subfolder.
#
#   ./scripts/export-standalone-repo.sh ../kalwings-site
#   cd ../kalwings-site && git remote add origin git@github.com:<you>/kalwings.git && git push -u origin main
set -euo pipefail
DEST="${1:?usage: export-standalone-repo.sh <new-directory>}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$SRC/.." && pwd)"
[ -e "$DEST" ] && { echo "$DEST already exists"; exit 1; }
mkdir -p "$DEST"
tar -C "$SRC" --exclude=node_modules --exclude=.next --exclude=.env --exclude=.env.local --exclude='*.tsbuildinfo' --exclude=next-env.d.ts -cf - . | tar -C "$DEST" -xf -
mkdir -p "$DEST/.github/workflows"
python3 - "$REPO_ROOT" "$DEST" <<'PY'
import re, sys, pathlib
root, dest = map(pathlib.Path, sys.argv[1:])
for f in (root / ".github/workflows").glob("*.yml"):
    s = f.read_text()
    s = re.sub(r"    defaults:\n      run:\n        working-directory: kalwings\n", "", s)
    s = s.replace("kalwings/package-lock.json", "package-lock.json").replace("            cd kalwings\n", "")
    (dest / ".github/workflows" / f.name).write_text(s)
d = (root / ".github/dependabot.yml").read_text().replace("directory: /kalwings", "directory: /")
(dest / ".github/dependabot.yml").write_text(d)
PY
cd "$DEST"
git init -q -b main && git add -A && git -c user.name="Kalwings" -c user.email="noreply@kalwings.com" commit -qm "Initial commit: Kalwings website and platform"
echo "Created $DEST (branch: main). Next: add your GitHub remote and push."
