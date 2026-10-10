"""Process generated store icon into standard extension sizes (128, 48, 16) and 512 store asset."""

import os
import sys
from PIL import Image

def process_icon(source_path: str):
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    icons_dir = os.path.join(root_dir, "icons")
    assets_dir = os.path.join(root_dir, "assets")
    os.makedirs(icons_dir, exist_ok=True)
    os.makedirs(assets_dir, exist_ok=True)

    img = Image.open(source_path)

    # 512x512 store listing icon
    store_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    store_512.save(os.path.join(assets_dir, "store-icon-512.png"), "PNG")
    print("Saved assets/store-icon-512.png")

    # Extension sizes
    for size in (128, 48, 16):
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        out_path = os.path.join(icons_dir, f"icon{size}.png")
        resized.save(out_path, "PNG")
        print(f"Saved icons/icon{size}.png ({size}x{size})")

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/prepare_store_icons.py <source_image_path>")
        sys.exit(1)
    src = sys.argv[1]
    if not os.path.isfile(src):
        print(f"Error: Source image not found: {src}")
        sys.exit(1)
    process_icon(src)

if __name__ == "__main__":
    main()
