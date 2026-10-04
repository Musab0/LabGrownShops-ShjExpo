#!/usr/bin/env python3
"""Add content fingerprints (?v=hash) to asset links so browsers fetch new files after each update.
Run from the repository root before publishing: python3 tools/stamp-assets.py"""
import hashlib, re, pathlib
site = pathlib.Path(__file__).resolve().parent.parent / "site"
def h(name): return hashlib.sha256((site / "assets" / name).read_bytes()).hexdigest()[:10]
app = site / "assets" / "app.js"
s = app.read_text()
s = re.sub(r'assets/gem3d\.js(\?v=[0-9a-f]+)?', "assets/gem3d.js?v=" + h("gem3d.js"), s)
app.write_text(s)
idx = site / "index.html"
html = idx.read_text()
for name in ("app.css", "data.js", "app.js"):
    html = re.sub(r'assets/' + re.escape(name) + r'(\?v=[0-9a-f]+)?"', 'assets/%s?v=%s"' % (name, h(name)), html)
idx.write_text(html)
print("stamped:", ", ".join("%s=%s" % (n, h(n)) for n in ("gem3d.js", "app.css", "data.js", "app.js")))
