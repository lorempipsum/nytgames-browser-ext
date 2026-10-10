"""Generate exact-dimension assets required by the Chrome Web Store."""

import os
from PIL import Image, ImageDraw, ImageFont

def generate_screenshot(assets_dir: str):
    src_path = os.path.join(assets_dir, "preview.png")
    src = Image.open(src_path).convert("RGB")

    # Chrome Web Store requires strictly 1280x800 or 640x400
    canvas = Image.new("RGB", (1280, 800), (255, 255, 255))
    scale = min(1200 / src.width, 740 / src.height)
    new_w = int(src.width * scale)
    new_h = int(src.height * scale)
    resized = src.resize((new_w, new_h), Image.Resampling.LANCZOS)

    offset_x = (1280 - new_w) // 2
    offset_y = (800 - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y))

    out_path = os.path.join(assets_dir, "store-screenshot-1280x800.png")
    canvas.save(out_path, "PNG")
    print(f"Generated {out_path} (1280x800, RGB)")

def generate_promo_tile(assets_dir: str):
    # Chrome Web Store requires strictly 440x280 for the Small Promo Tile
    canvas = Image.new("RGB", (440, 280), (32, 39, 47))
    icon_path = os.path.join(assets_dir, "store-icon-512.png")
    if os.path.isfile(icon_path):
        icon = Image.open(icon_path).convert("RGB")
        # Mask out white corners outside the rounded square
        icon_rgba = icon.convert("RGBA")
        datas = icon_rgba.getdata()
        new_data = []
        for item in datas:
            # If near white, make transparent
            if item[0] > 235 and item[1] > 235 and item[2] > 235:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        icon_rgba.putdata(new_data)
        icon_resized = icon_rgba.resize((150, 150), Image.Resampling.LANCZOS)
        canvas.paste(icon_resized, (32, (280 - 150) // 2), icon_resized)

    draw = ImageDraw.Draw(canvas)
    draw.text((205, 105), "The Mini", fill=(255, 255, 255))
    draw.text((205, 128), "Date Navigator", fill=(245, 180, 0))
    draw.text((205, 158), "Jump by Year, Month, Day", fill=(160, 175, 195))

    out_path = os.path.join(assets_dir, "store-promo-440x280.png")
    canvas.save(out_path, "PNG")
    print(f"Generated {out_path} (440x280, RGB)")

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(root_dir, "assets")
    generate_screenshot(assets_dir)
    generate_promo_tile(assets_dir)

if __name__ == "__main__":
    main()
