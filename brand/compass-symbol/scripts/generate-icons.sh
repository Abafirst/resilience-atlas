#!/usr/bin/env bash
# =============================================================================
# Resilience Atlas Compass Symbol — PNG Icon Generator
# =============================================================================
# Generates all raster PNG assets from the master SVG using Inkscape.
# Requires: Inkscape 1.x (https://inkscape.org/)
#
# Usage:
#   cd brand/compass-symbol
#   bash scripts/generate-icons.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
SVG_MASTER="$BASE_DIR/svg/compass-icon.svg"
PNG_DIR="$BASE_DIR/png"

command -v inkscape >/dev/null 2>&1 || {
  echo "ERROR: Inkscape is required. Install from https://inkscape.org/" >&2
  exit 1
}

export_png() {
  local size="$1"
  local output="$2"
  echo "  Generating ${size}x${size} → $output"
  inkscape \
    --export-type=png \
    --export-width="$size" \
    --export-height="$size" \
    --export-filename="$output" \
    "$SVG_MASTER" \
    2>/dev/null
}

echo "=== Resilience Atlas — PNG Icon Generator ==="
echo "Master SVG: $SVG_MASTER"
echo ""

# ── Favicon ──────────────────────────────────────────────────────────────────
echo "Generating favicons..."
export_png 16  "$PNG_DIR/favicon/favicon-16.png"
export_png 32  "$PNG_DIR/favicon/favicon-32.png"
export_png 64  "$PNG_DIR/favicon/favicon-64.png"

# ── iOS ──────────────────────────────────────────────────────────────────────
echo "Generating iOS icons..."
export_png 76  "$PNG_DIR/ios/icon-76.png"
export_png 120 "$PNG_DIR/ios/icon-120.png"
export_png 152 "$PNG_DIR/ios/icon-152.png"
export_png 180 "$PNG_DIR/ios/icon-180.png"

# Copy 180 as apple-touch-icon for web/
cp "$PNG_DIR/ios/icon-180.png" "$BASE_DIR/web/apple-touch-icon.png"
echo "  Copied apple-touch-icon.png → web/"

# ── Android ──────────────────────────────────────────────────────────────────
echo "Generating Android icons..."
export_png 48  "$PNG_DIR/android/android-icon-48.png"
export_png 72  "$PNG_DIR/android/android-icon-72.png"
export_png 96  "$PNG_DIR/android/android-icon-96.png"
export_png 144 "$PNG_DIR/android/android-icon-144.png"
export_png 192 "$PNG_DIR/android/android-icon-192.png"

# Round/maskable variant (same image; Android OS applies circular clipping mask)
# NOTE: For best results on Android launchers, the icon content should remain
# within the central 60% of the image (the "safe zone") to avoid clipping.
# If the compass arrows are clipped, regenerate using a smaller-radius SVG variant.
cp "$PNG_DIR/android/android-icon-192.png" "$PNG_DIR/android/android-icon-192-maskable.png"
echo "  Copied android-icon-192-maskable.png"

# ── Web icons ─────────────────────────────────────────────────────────────────
echo "Generating web icons..."
for size in 16 24 32 48 64 96 128 192 256 512; do
  export_png "$size" "$PNG_DIR/web/icon-${size}.png"
done

# ── Social media ─────────────────────────────────────────────────────────────
echo "Generating social media images..."
export_png 400  "$PNG_DIR/social/profile-400.png"
export_png 1080 "$PNG_DIR/social/instagram-1080.png"

# ── Print ────────────────────────────────────────────────────────────────────
echo "Generating print resolution..."
export_png 2400 "$PNG_DIR/print/print-2400.png"

# ── favicon.ico (multi-size) ──────────────────────────────────────────────────
echo "Generating favicon.ico..."
if command -v convert >/dev/null 2>&1; then
  convert \
    "$PNG_DIR/favicon/favicon-16.png" \
    "$PNG_DIR/favicon/favicon-32.png" \
    "$PNG_DIR/favicon/favicon-64.png" \
    "$BASE_DIR/web/favicon.ico"
  echo "  favicon.ico generated using ImageMagick"
else
  echo "  SKIP favicon.ico — ImageMagick 'convert' not found."
  echo "  Install ImageMagick and re-run, or generate favicon.ico manually."
fi

echo ""
echo "=== Done! All icons generated in $PNG_DIR ==="
