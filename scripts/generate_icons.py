"""Generate extension icons in PNG format."""

import os
from PIL import Image, ImageDraw

def create_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Outer rounded background
    radius = int(size * 0.18)
    margin = int(size * 0.04)
    draw.rounded_rectangle(
        [margin, margin, size - margin - 1, size - margin - 1],
        radius=radius,
        fill="#121212"
    )
    
    # Grid area inside
    inner_margin = int(size * 0.16)
    grid_size = size - inner_margin * 2
    cell_size = grid_size / 3.0
    gap = max(1, int(size * 0.03))
    
    # Draw 3x3 mini grid pattern
    for r in range(3):
        for c in range(3):
            x0 = int(inner_margin + c * cell_size + gap / 2)
            y0 = int(inner_margin + r * cell_size + gap / 2)
            x1 = int(inner_margin + (c + 1) * cell_size - gap / 2)
            y1 = int(inner_margin + (r + 1) * cell_size - gap / 2)
            
            # Pattern: corner cells white, center accent yellow, some black
            if r == 0 and c == 0:
                fill = "#FBBF24"  # Highlighted cell (NYT Mini active yellow)
            elif (r == 0 and c == 2) or (r == 2 and c == 1):
                fill = "#2B2B2B"  # Dark crossword block
            else:
                fill = "#FFFFFF"  # White letter cells
                
            draw.rectangle([x0, y0, x1, y1], fill=fill)
            
    return img

def main():
    icons_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "icons")
    os.makedirs(icons_dir, exist_ok=True)
    
    for size in (16, 48, 128):
        icon = create_icon(size)
        path = os.path.join(icons_dir, f"icon{size}.png")
        icon.save(path, "PNG")
        print(f"Generated {path}")

if __name__ == "__main__":
    main()
