import base64, io, os, re, sys
from PIL import Image, ImageDraw
D = os.path.dirname(os.path.abspath(__file__))
P = lambda *a: os.path.join(D, *a)

# icons: round the corners of the 1024 render (screenshot has opaque background)
im = Image.open(P("icon_1024.png")).convert("RGBA")
S = 1024
mask = Image.new("L", (S * 2, S * 2), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, S * 2 - 1, S * 2 - 1], radius=228 * 2, fill=255)
mask = mask.resize((S, S), Image.LANCZOS)
im.putalpha(mask)
os.makedirs(P("dist"), exist_ok=True)
for n in (1024, 512, 256, 180, 32):
    im.resize((n, n), Image.LANCZOS).save(P("dist", f"HalleyAstro_icon_{n}.png"))
im.save(P("dist", "HalleyAstro.ico"), sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
icon_uri = "data:image/png;base64," + base64.b64encode(open(P("dist", "HalleyAstro_icon_256.png"), "rb").read()).decode()

rd = lambda f: open(P(f), encoding="utf-8").read()
safe = lambda s: s.replace("</script", "<\\/script")
html = rd("index.html")
parts = {"CSS": rd("style.css"), "ASTRONOMY": rd("astronomy.min.js"), "ENGINE": rd("engine.js"), "INTERP": rd("interp.js"),
         "READING": rd("reading.js"), "REF": rd("astrologers.js"), "FAMOUS": rd("famous.js"), "FAMOUSDATA": rd("famous_data.js"), "FAMOUSMATCH": rd("famous_match.js"), "NEWS": rd("news.js"), "CHAT": rd("chat.js"), "LICENSE": rd("license.js"), "APP": rd("app.js")}
# usage: python bundle.py [tier] [outfile]  (tier free|supporter|pro forces a local test build; omit for the public build)
if len(sys.argv) > 1 and sys.argv[1] != "-":
    parts["LICENSE"] = parts["LICENSE"].replace('const BUILD_TIER = "";', 'const BUILD_TIER = "%s";' % sys.argv[1])
for k, v in parts.items():
    html = html.replace(f"/*@@{k}@@*/", safe(v).replace("url(icon.png)", f"url({icon_uri})") if k == "CSS" else safe(v))
html = html.replace("icon.png", icon_uri)
open(sys.argv[2] if len(sys.argv) > 2 else P("dist", "HalleyAstro.html"), "w", encoding="utf-8").write(html)
print("ok", len(html))
