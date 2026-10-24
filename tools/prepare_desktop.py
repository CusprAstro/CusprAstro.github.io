#!/usr/bin/env python3
"""Prepare one generated Electron payload without committing bundled output."""
import argparse
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"
TARGET = ROOT / "desktop" / "generated"

parser = argparse.ArgumentParser()
parser.add_argument("edition", choices=("free", "free_ads", "supporter", "pro", "pro_test"))
args = parser.parse_args()

TARGET.mkdir(parents=True, exist_ok=True)
subprocess.run([sys.executable, str(APP / "bundle.py"), args.edition, str(TARGET / "index.html")], cwd=ROOT, check=True)
shutil.copy2(APP / "dist" / "Cuspr_icon_512.png", TARGET / "icon.png")
shutil.copy2(APP / "dist" / "Cuspr.ico", TARGET / "icon.ico")
print(f"Prepared Cuspr {args.edition} in {TARGET}")
