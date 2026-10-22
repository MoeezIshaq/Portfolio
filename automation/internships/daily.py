"""Daily update for the /internships page and its Instagram carousel.

Usage:
  python3 -I automation/internships/daily.py --repo . --input today.json

today.json:
{
  "date": "Oct 22",
  "total": 65,                      # count from the email subject
  "postings": [["Company", "Role title", "<uuid>"], ...],   # every posting
  "picks": [["Company", "Exact title", "Short title (max 50 chars, optional)"], ... exactly 5]
}

Rewrites public/internships/index.html (data, date, count), renders the three
slides, and copies the JPEGs to public/internships/slides/. Stops on any
problem before changing the page.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

BANNED = "swe" + "list"  # source name must never reach the published page

ap = argparse.ArgumentParser()
ap.add_argument("--repo", required=True)
ap.add_argument("--input", required=True)
args = ap.parse_args()

here = os.path.dirname(os.path.abspath(__file__))
page_path = os.path.join(args.repo, "public", "internships", "index.html")
slides_dir = os.path.join(args.repo, "public", "internships", "slides")

with open(args.input, encoding="utf-8") as fh:
    cfg = json.load(fh)
date, total = cfg["date"], int(cfg["total"])
rows, picks = cfg["postings"], cfg["picks"]

# ---- validate before touching anything
uuid_re = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
problems = []
if not re.match(r"^[A-Z][a-z]{2} \d{1,2}$", date):
    problems.append(f"date should look like 'Oct 22', got {date!r}")
if len(picks) != 5 or any(len(p) not in (2, 3) for p in picks):
    problems.append("picks must be exactly 5 items: [company, title] or [company, title, short title]")
for p in picks:
    if len(p) == 3 and len(p[2]) > 50:
        problems.append(f"short title too long ({len(p[2])} chars, max 50): {p[2]}")
if any(len(r) != 3 or not uuid_re.match(r[2]) for r in rows):
    problems.append("every posting needs [company, title, uuid] with a valid uuid")
if len({r[2] for r in rows}) != len(rows):
    problems.append("duplicate posting ids")
if len(rows) != total:
    problems.append(f"{len(rows)} postings parsed but the email subject says {total}")
blob = json.dumps(cfg).lower()
if BANNED in blob:
    problems.append("input mentions the source; remove it")
pick_set = {(p[0], p[1]) for p in picks if len(p) >= 2}
row_set = {(r[0], r[1]) for r in rows}
if not pick_set <= row_set:
    problems.append("a pick is not in the postings list: " + "; ".join(sorted(f"{a} | {b}" for a, b in pick_set - row_set)))
if problems:
    print("STOP:\n- " + "\n- ".join(problems))
    sys.exit(1)

# ---- render slides into a temp dir first
tmp = tempfile.mkdtemp()
subprocess.run([sys.executable, "-I", os.path.join(here, "make_slides.py"), tmp, args.input], check=True)
for n in ("slide_1_cover", "slide_2_picks", "slide_3_cta"):
    if not os.path.exists(os.path.join(tmp, n + ".jpg")):
        print("STOP: slide render failed:", n)
        sys.exit(1)

# ---- rewrite the page
html = open(page_path, encoding="utf-8").read()
data_js = "var DATA = [\n" + ",\n".join(json.dumps(r, ensure_ascii=False, separators=(",", ":")) for r in rows) + "\n];"
html, n1 = re.subn(r"var DATA = \[.*?\n\];", lambda m: data_js, html, count=1, flags=re.S)
html, n2 = re.subn(r'(<div class="eyebrow">).*?(</div>)', lambda m: f'{m.group(1)}{date} · Daily drop{m.group(2)}', html, count=1)
html, n3 = re.subn(r"<h1>.*?</h1>", lambda m: f"<h1>{total} new tech internships</h1>", html, count=1)
if (n1, n2, n3) != (1, 1, 1):
    print("STOP: page layout changed, could not update", (n1, n2, n3))
    sys.exit(1)
if BANNED in html.lower() or "?utm" in html:
    print("STOP: page contains a source mention or tracking tag")
    sys.exit(1)

open(page_path, "w", encoding="utf-8").write(html)
os.makedirs(slides_dir, exist_ok=True)
for n, out in (("slide_1_cover", "slide_1.jpg"), ("slide_2_picks", "slide_2.jpg"), ("slide_3_cta", "slide_3.jpg")):
    shutil.copy(os.path.join(tmp, n + ".jpg"), os.path.join(slides_dir, out))
print(f"ok: {len(rows)} postings, date {date}, slides updated")
