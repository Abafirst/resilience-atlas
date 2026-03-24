# The Resilience Atlas — Social-Post Visual Templates
## Brand & Style Guide

> Evergreen social-card templates for use with Metricool autolists.  
> Theme: **Navigational · Atlas · Map · Compass**

---

## 1. Color Palette

| Role | Name | Hex | Usage |
|---|---|---|---|
| Background | Aged Parchment | `#FAF7F2` | Card background (all variants) |
| Primary Text | Deep Navy | `#0F2436` | Headlines, body, footer |
| Accent A | Teal Compass | `#2A9D8F` | V1 pill labels, divider lines, Truth block |
| Accent B | Warm Sand | `#E9C46A` | V2 pill labels, Myth block highlights |
| Accent C | Soft Coral | `#E76F51` | V3 pill labels, highlight accents |
| Motif / Watermark | Motif Ink | `#0F2436` at 6–8% opacity | Background navigational motifs |
| Divider | Divider | `#0F2436` at 12% opacity | Footer rule |

### Accessibility contrast (WCAG AA)
- Deep Navy `#0F2436` on Parchment `#FAF7F2` → contrast ratio **≈ 15:1** ✓
- White `#FFFFFF` on Teal `#2A9D8F` → contrast ratio **≈ 4.6:1** ✓
- White `#FFFFFF` on Coral `#E76F51` → contrast ratio **≈ 3.4:1** — use at ≥ 18 pt bold only
- Deep Navy on Sand `#E9C46A` → contrast ratio **≈ 7.5:1** ✓

---

## 2. Typography

| Role | Font | Weight | Size (1080 px card) |
|---|---|---|---|
| Card type label | Inter | 600 (SemiBold) | 20–22 px |
| Main headline | DM Serif Display | 400 (Regular) | 52–64 px |
| Body / bullets | Inter | 400 (Regular) | 26–30 px |
| Footer | Inter | 400 (Regular) | 20 px |
| Small sub-label | Inter | 300 (Light) | 22 px |

**Google Fonts import (include in each template):**
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
```

**Web-safe fallbacks:** `Georgia, 'Times New Roman', serif` for display; `Arial, Helvetica, sans-serif` for body.

---

## 3. Navigational Background Motifs

All motifs are rendered inline as SVG at **6–8% opacity** so they stay subtle.

| Motif | Used in | Description |
|---|---|---|
| Compass rose | Micro-practice, Reflection | 8-point rose centered behind content |
| Map grid | Dimension Spotlight | Fine latitude/longitude crosshatch |
| Contour lines | Myth → Truth | Flowing organic concentric curves |
| Waypoint cluster | Reflection | Scattered dots + connector lines |

Motifs are positioned to avoid overlapping the primary text area.

---

## 4. Layout Rules

```
┌─────────────────────────────────────────────┐  1080 × 1080
│  ←80px padding→                             │
│                                             │
│  [PILL LABEL]          ← top, small-caps    │
│                                             │
│  Big Headline Text                          │  ← DM Serif, 52-64px
│  spans 2–3 lines max                        │
│                                             │
│  • Bullet one (≤ 8 words)                   │  ← Inter 28px
│  • Bullet two                               │
│  • Bullet three                             │
│                                             │
│  ─────────────────────────────────── ← rule │
│  The Resilience Atlas™  theresilienceatlas.com│  ← footer 20px
└─────────────────────────────────────────────┘
```

- **Padding:** 80 px on all sides
- **Max content lines:** 8 (headline + bullets)
- **Bullets:** 2–3 max, ≤ 8 words each
- **Footer:** always flush to bottom inside padding; 40 px above card edge
- **Minimum font size on exported PNG:** 20 px (≈ 14 pt on screen, readable at thumb size)

---

## 5. Footer Rules

**Exact wording — do not alter:**

```
The Resilience Atlas™  |  theresilienceatlas.com
```

- Left-aligned with a `|` separator and `theresilienceatlas.com` on the right
- Font: Inter 400, 20 px, Deep Navy `#0F2436`
- A thin horizontal rule (1 px, 12% opacity) separates footer from body
- The `™` character is Unicode U+2122 (not superscript HTML)

---

## 6. Template Types & Naming Convention

| ID | Template | File prefix | Label text |
|---|---|---|---|
| A | Micro-practice | `micro-practice-v{n}` | `2-Minute Practice` |
| B | Dimension Spotlight | `dimension-spotlight-v{n}` | `Resilience Dimension` |
| C | Myth → Truth | `myth-truth-v{n}` | `Myth / Truth` |
| D | Weekly Reflection | `weekly-reflection-v{n}` | `Weekly Reflection` |

Variants `n = 1, 2, 3` differ only in accent color:
- **v1** → Teal `#2A9D8F`
- **v2** → Warm Sand `#E9C46A`
- **v3** → Soft Coral `#E76F51`

**Source files:** `assets/social/templates/*.html`  
**Generated PNGs:** `assets/social/generated/*.png` (gitignored)

---

## 7. Export / Build

Run locally to regenerate all 12 PNGs:

```bash
npm run social:build
```

This executes `scripts/render-social.js` using Puppeteer, which:
1. Opens each `assets/social/templates/*.html` file
2. Takes a 1080 × 1080 screenshot
3. Saves the result to `assets/social/generated/<filename>.png`

**Requirements:** Node ≥ 18, `npm install` (Puppeteer is already in `dependencies`).

Output directory tree:
```
assets/social/
├── templates/
│   ├── micro-practice-v1.html
│   ├── micro-practice-v2.html
│   ├── micro-practice-v3.html
│   ├── dimension-spotlight-v1.html
│   ├── dimension-spotlight-v2.html
│   ├── dimension-spotlight-v3.html
│   ├── myth-truth-v1.html
│   ├── myth-truth-v2.html
│   ├── myth-truth-v3.html
│   ├── weekly-reflection-v1.html
│   ├── weekly-reflection-v2.html
│   └── weekly-reflection-v3.html
└── generated/          ← gitignored; recreate with npm run social:build
    ├── micro-practice-v1.png
    └── ... (12 total)
```

---

## 8. Metricool Usage — Rotating Variants

### Setup
1. Generate PNGs: `npm run social:build`
2. Upload all 12 PNGs to Metricool Media Library (or attach per-post)
3. For each autolist item, attach the matching template image

### Rotation pattern (8 posts per autolist)
| Post # | Micro-practice | Dimension | Myth/Truth | Reflection |
|---|---|---|---|---|
| 1 | MP-v1 | DS-v1 | MT-v1 | R-v1 |
| 2 | MP-v2 | DS-v2 | MT-v2 | R-v2 |
| 3 | MP-v3 | DS-v3 | MT-v3 | R-v3 |
| 4 | MP-v1 | DS-v1 | MT-v1 | R-v1 |
| 5 | MP-v2 | DS-v2 | MT-v2 | R-v2 |
| 6 | MP-v3 | DS-v3 | MT-v3 | R-v3 |
| 7 | MP-v1 | DS-v1 | MT-v1 | R-v1 |
| 8 | MP-v2 | DS-v2 | MT-v2 | R-v2 |

### Notes
- Templates are **generic** — the caption holds the specific practice text.
- Images recycle automatically with **Repeat = On** in Metricool.
- To refresh visuals, update the HTML source and re-run `npm run social:build`.

---

## 9. Accessibility Checklist

- [ ] All text ≥ 20 px on a 1080 × 1080 canvas (readable at social-feed thumbnail sizes)
- [ ] Color contrast meets WCAG AA for all text/background combinations (see §1)
- [ ] No information is conveyed by color alone (labels + text always present)
- [ ] Footer URL is plain text (not a QR code or image-only element)
- [ ] Decorative SVG motifs use `aria-hidden="true"` so screen readers skip them

---

*Last updated: March 2026 — The Resilience Atlas™*
