# The Resilience Atlas™ — Social Template Style Guide

> Warm · Organic · Professional  
> Atlas / Navigation / Compass theme

---

## Palette

| Role | Name | Hex |
|------|------|-----|
| Background | Cream | `#FAF7F2` |
| Primary Text | Deep Navy | `#0F2436` |
| Accent 1 | Teal | `#2A9D8F` |
| Accent 2 | Warm Sand | `#E9C46A` |
| Accent 3 | Soft Coral | `#E76F51` |
| Footer BG | Darker Navy | `#091A28` |
| On-dark Text | Cream White | `#FAF7F2` |

### Usage rules

- **Background**: Always Cream `#FAF7F2` (light templates) or Deep Navy `#0F2436` (dark templates).
- **Body text**: Always Deep Navy on Cream; always Cream on Navy.
- **Accent**: One accent color per template. Never mix Teal + Coral on the same asset.
- **Footer**: Always `#091A28` background with Cream text regardless of template type.

### Variant rotation

| Variant | Accent | Best for |
|---------|--------|---------|
| 01 | Teal `#2A9D8F` | Default / calm |
| 02 | Warm Sand `#E9C46A` | Energetic / warm |
| 03 | Soft Coral `#E76F51` | Bold / contrast |

---

## Typography

| Role | Font | Size (1080 px canvas) | Weight |
|------|------|----------------------|--------|
| Headline | DM Serif Display | 66–82 px | 400 (regular) |
| Section label | Inter / Source Sans 3 | 17–22 px | 700, letter-spacing 2–4 |
| Body / bullets | Inter / Source Sans 3 | 26–30 px | 400 |
| Pill label | Inter / Source Sans 3 | 22 px | 700 |
| Footer | Inter / Source Sans 3 | 22–26 px | 600 (brand name), 400 (URL) |

**Canva equivalents**: DM Serif Display is available in Canva. Use Inter or Source Sans 3 for body.  
**SVG fallback stack**: `'DM Serif Display', Georgia, 'Times New Roman', serif` / `'Inter', 'Source Sans 3', Arial, sans-serif`

---

## Spacing & Layout

- **Canvas**: 1080 × 1080 px (square, cross-platform safe)
- **Left margin**: 80 px
- **Right margin**: 80 px from right edge (content up to x = 1000)
- **Top accent strip**: 8 px (accent color)
- **Left accent rule**: 5 px wide (accent color, 22–35% opacity)
- **Footer height**: 128 px (y = 952 → y = 1080)
- **Footer divider line**: 2.5 px, accent color at y = 952
- **Whitespace**: generous — keep bullet count to 3 maximum

---

## Navigational / Compass Motif

Each template includes a faint compass rose in a corner (5–10% opacity).  
The motif consists of:

- Two concentric dashed rings
- Cardinal direction lines (N / S / E / W)
- Diagonal lines at 45°
- Bold tick marks at the four cardinal points
- A small center dot

This references the Atlas / navigation metaphor without requiring an imported logo.  
Additional subtle elements used per template type:

| Template type | Decorative element |
|---------------|--------------------|
| Micro-practice | Compass rose, top-right corner |
| Dimension spotlight | Map grid lines + compass rose, bottom-right corner |
| Myth → Truth | Compass rose centered on split divider |
| Reflection | Coordinate grid + compass rose + faint large "?" |

---

## Do ✓ / Don't ✗

| ✓ Do | ✗ Don't |
|------|---------|
| Use one accent color per asset | Mix more than one accent |
| Keep body text ≤ 3 bullets or 2 short lines | Add long paragraphs |
| Use generous whitespace | Crowd the footer area |
| Rotate variants (01 → 02 → 03 → 01…) | Use the same variant back-to-back |
| Export at 1080 × 1080 | Resize down below 800 × 800 |
| Keep footer text exactly as specified | Alter The Resilience Atlas™ brand text |

---

## Footer specification (all templates)

```
The Resilience Atlas™          theresilienceatlas.com
```

- Left-aligned brand name, font-weight 600, 26 px
- Right-aligned URL, font-weight 400, 22 px, 75% opacity
- Background: `#091A28`; Text: `#FAF7F2`
- Top border: 2.5 px in current accent color
