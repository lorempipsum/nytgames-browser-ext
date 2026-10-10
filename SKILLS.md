# Project Skills & Scripts

## Scripts

- `scripts/generate_icons.py`: Generates extension icons in 16x16, 48x48, and 128x128 PNG formats. Run with `uv run --with pillow python scripts/generate_icons.py`.
- `scripts/prepare_preview.py`: Copies and crops preview screenshot into the `assets` directory. Run with `uv run --with pillow python scripts/prepare_preview.py <source_image_path>`.
- `scripts/package_extension.py`: Packages only distribution-ready extension files into `dist/nyt-mini-date-navigator.zip`. Run with `uv run python scripts/package_extension.py`.
- `scripts/prepare_store_icons.py`: Resizes store icon concepts into standard extension sizes (128, 48, 16) and a 512x512 store listing asset in `assets/store-icon-512.png`. Run with `uv run --with pillow python scripts/prepare_store_icons.py <source_image_path>`.
- `scripts/prepare_store_assets.py`: Generates exact-dimension Chrome Web Store assets: 1280x800 store screenshot (`assets/store-screenshot-1280x800.png`) and 440x280 small promo tile (`assets/store-promo-440x280.png`). Run with `uv run --with pillow python scripts/prepare_store_assets.py`.
