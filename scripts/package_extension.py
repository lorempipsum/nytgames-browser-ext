"""Build a clean distribution zip archive of the browser extension."""

import os
import zipfile

INCLUDED_FILES = [
    "manifest.json",
    "navigation.js",
    "content.js",
    "content.css",
    "popup.html",
    "README.md",
    "LICENSE",
    "PRIVACY.md",
]

INCLUDED_DIRS = [
    "icons",
    "assets",
]

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dist_dir = os.path.join(root_dir, "dist")
    os.makedirs(dist_dir, exist_ok=True)
    zip_path = os.path.join(dist_dir, "crossword-date-navigator.zip")

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fname in INCLUDED_FILES:
            src = os.path.join(root_dir, fname)
            if os.path.isfile(src):
                zf.write(src, arcname=fname)
                print(f"Added {fname}")

        for dname in INCLUDED_DIRS:
            src_d = os.path.join(root_dir, dname)
            if os.path.isdir(src_d):
                for root, _, files in os.walk(src_d):
                    for f in files:
                        full = os.path.join(root, f)
                        rel = os.path.relpath(full, root_dir)
                        zf.write(full, arcname=rel)
                        print(f"Added {rel}")

    print(f"\nCreated distribution archive: {zip_path}")

if __name__ == "__main__":
    main()
