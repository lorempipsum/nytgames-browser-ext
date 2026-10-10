"""Copy and crop the preview image into the extension assets folder."""

import os
import sys
from PIL import Image

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/prepare_preview.py <source_image_path>")
        sys.exit(1)

    src_path = sys.argv[1]
    if not os.path.isfile(src_path):
        print(f"Error: Source image not found: {src_path}")
        sys.exit(1)

    assets_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
    os.makedirs(assets_dir, exist_ok=True)
    
    img = Image.open(src_path)
    
    # Save full preview
    full_dest = os.path.join(assets_dir, "preview.png")
    img.save(full_dest, "PNG")
    print(f"Saved full preview to {full_dest}")

    # Precision crop around the header bar and buttons
    crop_box = (240, 425, 1400, 525)
    cropped = img.crop(crop_box)
    crop_dest = os.path.join(assets_dir, "preview.png")
    cropped.save(crop_dest, "PNG")
    print(f"Saved cropped preview to {crop_dest}")

if __name__ == "__main__":
    main()

