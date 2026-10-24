import base64, os, sys
from PIL import Image, ImageDraw
D = os.path.dirname(os.path.abspath(__file__))
P = lambda *a: os.path.join(D, *a)

# Icons: round the source render and add Cuspr's gold orbital signature.
im = Image.open(P("icon_1024.png")).convert("RGBA")
S = 1024
mask = Image.new("L", (S * 2, S * 2), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, S * 2 - 1, S * 2 - 1], radius=228 * 2, fill=255)
mask = mask.resize((S, S), Image.LANCZOS)
im.putalpha(mask)
orb = Image.new("RGBA", im.size, (0, 0, 0, 0))
od = ImageDraw.Draw(orb)
od.arc((116, 128, 908, 920), 205, 348, fill=(255, 220, 152, 185), width=9)
od.arc((116, 128, 908, 920), 18, 112, fill=(139, 197, 255, 145), width=5)
od.ellipse((184, 776, 211, 803), fill=(255, 238, 194, 235))
od.ellipse((821, 182, 837, 198), fill=(255, 255, 255, 225))
im = Image.alpha_composite(im, orb)
os.makedirs(P("dist"), exist_ok=True)
for n in (1024, 600, 512, 256, 180, 32):
    im.resize((n, n), Image.LANCZOS).save(P("dist", f"Cuspr_icon_{n}.png"), optimize=True)
im.save(P("dist", "Cuspr.ico"), sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
icon_uri = "data:image/png;base64," + base64.b64encode(open(P("dist", "Cuspr_icon_256.png"), "rb").read()).decode()

rd = lambda f: open(P(f), encoding="utf-8").read()
safe = lambda s: s.replace("</script", "<\\/script")
html = rd("index.html")
parts = {"CSS": rd("style.css"), "ASTRONOMY": rd("astronomy.min.js"), "ENGINE": rd("engine.js"), "INTERP": rd("interp.js"),
         "READING": rd("reading.js"), "PLANNER": rd("planner.js"), "REF": rd("astrologers.js"), "FAMOUS": rd("famous.js"), "FAMOUSDATA": rd("famous_data.js"), "FAMOUSMATCH": rd("famous_match.js"), "NEWS": rd("news.js"), "CHAT": rd("chat.js"), "LICENSE": rd("license.js"), "APP": rd("app.js")}
# usage: python bundle.py [edition] [outfile]
edition = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] != "-" else ""
if edition not in ("", "free", "free_ads", "supporter", "pro", "pro_test"):
    raise SystemExit("edition must be free, free_ads, supporter, pro, or pro_test")
if edition:
    parts["LICENSE"] = parts["LICENSE"].replace('const BUILD_EDITION = "";', 'const BUILD_EDITION = "%s";' % edition)
for k, v in parts.items():
    html = html.replace(f"/*@@{k}@@*/", safe(v).replace("url(icon.png)", f"url({icon_uri})") if k == "CSS" else safe(v))
html = html.replace("icon.png", icon_uri)
outfile = sys.argv[2] if len(sys.argv) > 2 else P("dist", "Cuspr.html")
open(outfile, "w", encoding="utf-8").write(html)
print("ok", edition or "public-free", len(html), outfile)
