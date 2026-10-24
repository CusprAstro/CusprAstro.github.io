import base64, io, os, re, sys
from PIL import Image, ImageDraw
D = os.path.dirname(os.path.abspath(__file__))
P = lambda *a: os.path.join(D, *a)

# Original Cuspr mark, rendered directly so release icons do not depend on external design assets.
S = 1200
im = Image.new("RGBA", (S, S), "#080d2b")
d = ImageDraw.Draw(im)
for r in range(S // 2, 0, -2):
    t = r / (S / 2)
    col = (int(8 + 40 * t), int(13 + 46 * t), int(43 + 95 * t), 255)
    d.ellipse((S / 2 - r, S / 2 - r, S / 2 + r, S / 2 + r), fill=col)
d.arc((175, 650, 1025, 1050), 198, 342, fill="#80b6ff", width=25)
d.ellipse((300, 175, 930, 805), fill="#ffcf7d")
d.ellipse((430, 105, 995, 735), fill="#171d54")
d.ellipse((815, 245, 845, 275), fill="#fff3bd")
d.polygon([(232, 325), (248, 365), (288, 381), (248, 397), (232, 437), (216, 397), (176, 381), (216, 365)], fill="#9ac8ff")
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=264, fill=255)
im.putalpha(mask)
os.makedirs(P("dist"), exist_ok=True)
for n in (1024, 600, 512, 256, 180, 64, 32):
    name = "Cuspr_Gumroad_600.png" if n == 600 else f"Cuspr_icon_{n}.png"
    im.resize((n, n), Image.LANCZOS).save(P("dist", name), optimize=True)
im.resize((256, 256), Image.LANCZOS).save(P("dist", "Cuspr.ico"), sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
icon_uri = "data:image/png;base64," + base64.b64encode(open(P("dist", "Cuspr_icon_256.png"), "rb").read()).decode()

rd = lambda f: open(P(f), encoding="utf-8").read()
safe = lambda s: s.replace("</script", "<\\/script")
html = rd("index.html")
parts = {"CSS": rd("style.css"), "ASTRONOMY": rd("astronomy.min.js"), "ENGINE": rd("engine.js"), "INTERP": rd("interp.js"),
         "READING": rd("reading.js"), "REF": rd("astrologers.js"), "FAMOUS": rd("famous.js"), "FAMOUSDATA": rd("famous_data.js"), "FAMOUSMATCH": rd("famous_match.js"), "NEWS": rd("news.js"), "CHAT": rd("chat.js"), "LICENSE": rd("license.js"), "PLANNER": rd("planner.js"), "PWA": rd("pwa.js"), "APP": rd("app.js")}
# usage: python bundle.py [edition] [outfile] [unlock]
# edition controls presentation/default selection only. The optional literal "unlock" creates a local QA artifact.
edition = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] != "-" else "free"
if edition not in ("free", "ads", "supporter", "pro"): raise SystemExit("invalid edition")
parts["LICENSE"] = parts["LICENSE"].replace('const BUILD_EDITION = "free";', 'const BUILD_EDITION = "%s";' % edition)
if len(sys.argv) > 3 and sys.argv[3] == "unlock":
    parts["LICENSE"] = parts["LICENSE"].replace('const BUILD_TIER = "";', 'const BUILD_TIER = "pro";')
for k, v in parts.items():
    html = html.replace(f"/*@@{k}@@*/", safe(v).replace("url(icon.png)", f"url({icon_uri})") if k == "CSS" else safe(v))
html = html.replace("icon.svg", icon_uri).replace("icon.png", icon_uri)
open(sys.argv[2] if len(sys.argv) > 2 else P("dist", "Cuspr.html"), "w", encoding="utf-8").write(html)
print("ok", len(html))
