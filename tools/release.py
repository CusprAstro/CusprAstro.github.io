#!/usr/bin/env python3
"""Build deterministic Cuspr edition ZIPs and local release metadata."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"
OUT = ROOT / "release-assets"
VERSION = "0.3.0-beta"
ALL_EDITIONS = ("free", "free_ads", "supporter", "pro", "pro_test")
DISPLAY = {
    "free": "Free",
    "free_ads": "Free with Ads",
    "supporter": "Supporter",
    "pro": "Pro",
    "pro_test": "Unlocked Pro Test",
}
SLUG = {"free_ads": "free-with-ads", "pro_test": "pro-test"}
ZIP_TIME = (2026, 1, 1, 0, 0, 0)


def run_bundle(edition: str, outfile: Path) -> None:
    subprocess.run(
        [sys.executable, str(APP / "bundle.py"), edition, str(outfile)],
        cwd=ROOT,
        check=True,
    )


def write_zip(path: Path, files: list[tuple[str, bytes]]) -> None:
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for name, content in sorted(files):
            info = zipfile.ZipInfo(name, ZIP_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            zf.writestr(info, content)


def edition_readme(edition: str) -> bytes:
    access = {
        "free": "Limited, ad-free access. Paid keys can be activated from Plans.",
        "free_ads": "Supporter-level features with restrained sponsored cards. Paid keys remove ads.",
        "supporter": "Supporter product package. A valid Supporter or Pro purchaser key is required.",
        "pro": "Pro product package. A valid Pro purchaser key is required for Pro access.",
        "pro_test": "UNLOCKED TEST PACKAGE. For publisher testing only. Do not distribute publicly.",
    }[edition]
    text = f"""Cuspr {VERSION} — {DISPLAY[edition]}

{access}

Open Cuspr.html in a current browser. The file is self-contained and can run offline after activation.
Profiles and cached entitlement data stay in that browser's local storage.

Gumroad activation uses the official Gumroad license verification endpoint. The product IDs embedded in
the app are not purchaser keys and cannot unlock features by themselves.

Astrology is symbolic guidance for reflection and entertainment, not medical, legal, financial, safety,
or relationship advice.

Project: https://github.com/CusprAstro/CusprAstro.github.io
"""
    return text.encode("utf-8")


def make_sbom() -> bytes:
    lock = json.loads((ROOT / "desktop" / "package-lock.json").read_text(encoding="utf-8"))
    packages = [{
        "SPDXID": "SPDXRef-Package-Cuspr",
        "name": "Cuspr",
        "versionInfo": VERSION,
        "downloadLocation": "https://github.com/CusprAstro/CusprAstro.github.io",
        "filesAnalyzed": False,
        "licenseConcluded": "MIT",
        "licenseDeclared": "MIT",
        "copyrightText": "NOASSERTION",
    }]
    relationships = []
    for path, meta in sorted(lock.get("packages", {}).items()):
        if not path.startswith("node_modules/") or not meta.get("version"):
            continue
        name = path.split("node_modules/")[-1].replace("/", "-")
        spdx_id = "SPDXRef-NPM-" + "".join(c if c.isalnum() or c in ".-" else "-" for c in name)
        packages.append({
            "SPDXID": spdx_id,
            "name": path.split("node_modules/")[-1],
            "versionInfo": str(meta["version"]),
            "downloadLocation": str(meta.get("resolved", "NOASSERTION")),
            "filesAnalyzed": False,
            "licenseConcluded": str(meta.get("license", "NOASSERTION")),
            "licenseDeclared": str(meta.get("license", "NOASSERTION")),
            "copyrightText": "NOASSERTION",
        })
        relationships.append({"spdxElementId": "SPDXRef-Package-Cuspr", "relationshipType": "DEPENDS_ON", "relatedSpdxElement": spdx_id})
    doc = {
        "spdxVersion": "SPDX-2.3",
        "dataLicense": "CC0-1.0",
        "SPDXID": "SPDXRef-DOCUMENT",
        "name": f"Cuspr-{VERSION}",
        "documentNamespace": f"https://github.com/CusprAstro/CusprAstro.github.io/releases/{VERSION}/spdx",
        "creationInfo": {"created": "2026-01-01T00:00:00Z", "creators": ["Tool: tools/release.py"]},
        "packages": packages,
        "relationships": [{"spdxElementId": "SPDXRef-DOCUMENT", "relationshipType": "DESCRIBES", "relatedSpdxElement": "SPDXRef-Package-Cuspr"}, *relationships],
    }
    return (json.dumps(doc, indent=2, sort_keys=True) + "\n").encode("utf-8")


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--public-only", action="store_true", help="Build only Free and Free with Ads packages.")
    args = parser.parse_args()
    editions = ("free", "free_ads") if args.public_only else ALL_EDITIONS
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "branding").mkdir(parents=True)
    stage = OUT / ".stage"
    stage.mkdir()
    built = []
    license_text = (ROOT / "LICENSE").read_bytes()
    for edition in editions:
        html = stage / f"Cuspr-{edition}.html"
        run_bundle(edition, html)
        slug = SLUG.get(edition, edition)
        target = OUT / f"Cuspr-{VERSION}-{slug}.zip"
        icon = APP / "dist" / "Cuspr_icon_600.png"
        write_zip(target, [
            ("Cuspr.html", html.read_bytes()),
            ("README.txt", edition_readme(edition)),
            ("LICENSE.txt", license_text),
            ("assets/cuspr-icon-600.png", icon.read_bytes()),
        ])
        built.append(target)
    shutil.copy2(APP / "dist" / "Cuspr_icon_600.png", OUT / "branding" / "cuspr-gumroad-icon-600.png")
    for size in (1024, 512, 256, 180, 32):
        shutil.copy2(APP / "dist" / f"Cuspr_icon_{size}.png", OUT / "branding" / f"cuspr-icon-{size}.png")
    shutil.copy2(APP / "dist" / "Cuspr.ico", OUT / "branding" / "cuspr.ico")
    shutil.copy2(APP / "icon.svg", OUT / "branding" / "cuspr-icon.svg")
    sbom = OUT / f"Cuspr-{VERSION}.spdx.json"
    sbom.write_bytes(make_sbom())
    checks = [*built, sbom]
    (OUT / "SHA256SUMS").write_text("".join(f"{sha256(p)}  {p.name}\n" for p in checks), encoding="utf-8", newline="\n")
    shutil.rmtree(stage)
    print(f"Built {len(built)} edition ZIPs in {OUT}")
    for path in built:
        print(path)
    print(OUT / "branding" / "cuspr-gumroad-icon-600.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
