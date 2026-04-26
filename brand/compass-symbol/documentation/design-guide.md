# Resilience Atlas Compass Symbol — Design Guide

## Overview

The Resilience Atlas compass symbol is a six-point geometric star representing the six dimensions of human resilience. The design unites navigational precision (compass) with systemic wholeness (the six-sided hexagon), reflecting the platform's mission of helping individuals discover and develop their resilience.

---

## Symbol Architecture

| Property | Value |
|---|---|
| Type | Six-point compass star |
| Symmetry | 6-fold rotational symmetry |
| Style | Minimalist geometric |
| ViewBox | `0 0 200 200` |
| Master file | `svg/compass-icon.svg` |

---

## Six Compass Points

Each of the six arrows maps directly to a resilience dimension. Adjacent arrows share a color domain.

| Direction | Degrees | Dimension | Domain | color |
|---|---|---|---|---|
| North | 0° | Cognitive-Narrative | Navigation | `#1565C0` Deep Navy |
| Northeast | 60° | Agentic-Generative | Navigation | `#1565C0` Deep Navy |
| Southeast | 120° | Spiritual-Existential | Anchoring | `#6A4C93` Muted Purple |
| South | 180° | Somatic-Regulative | Anchoring | `#6A4C93` Muted Purple |
| Southwest | 240° | Emotional-Adaptive | Connection | `#0097A7` Soft Teal |
| Northwest | 300° | Relational | Connection | `#0097A7` Soft Teal |

### Domain Groupings

- **Navigation (Blue):** Cognitive & Agentic dimensions — meaning, perspective, action, growth
- **Anchoring (Purple):** Spiritual & Somatic dimensions — purpose, values, body, habits
- **Connection (Teal):** Emotional & Relational dimensions — flexibility, support, connection

---

## Symbol Components

### 1. Outer Circle (Atlas Map Boundary)
- Stroke: `#1565C0`, 2 px
- Radius: 88 units (in a 200 × 200 viewBox)
- Represents the wholeness of the atlas and containment of all dimensions

### 2. Six Minimalist Arrows
- Clean geometric arrow shape (arrowhead + rectangular shaft)
- Arrow tip radius: 78 units from center
- Arrow shaft base radius: 35 units from center
- Arrow shaft width: 6 units
- Arrowhead width: 14 units
- color-coded by domain (see table above)
- Subtle drop shadow for depth

### 3. Inner Hexagon (Structural Interconnection)
- Vertices at 40 units from center, one per arrow direction
- Stroke: `#BDBDBD`, 1 px, 55% opacity
- Represents structural interconnection between dimensions
- Used for educational and explanatory contexts

### 4. Radial Connecting Lines
- Six dashed lines from center to each hexagon vertex
- Stroke: `#757575`, 0.75 px, 30% opacity, `stroke-dasharray="2,3"`
- Represents the individual's relationship to each dimension

### 5. Degree Markers
- 12 tick marks at 30° intervals around the outer boundary
- Stroke: `#1565C0`, 1.5 px, 20% opacity
- Suggests compass directional precision

### 6. Central Dot (The Individual)
- Radius: 8 units
- Fill: Radial gradient from `#5B9BD5` (highlight) → `#1565C0` → `#0D3E7A`
- Small highlight circle (`r="2.5"`, white, 35% opacity) for depth
- Represents the centerd individual at the heart of the system

---

## color Palette

### Brand colors

| Name | Hex | Usage |
|---|---|---|
| Deep Navy | `#1565C0` | Navigation domain, outer circle, central dot |
| Muted Purple | `#6A4C93` | Anchoring domain |
| Soft Teal | `#0097A7` | Connection domain |

### Neutral colors

| Name | Hex | Usage |
|---|---|---|
| Neutral Dark | `#212121` | Primary text |
| Neutral Medium | `#424242` | Secondary text |
| Neutral Light | `#757575` | Subtle elements |
| Neutral Very Light | `#BDBDBD` | Structural lines |
| Background White | `#FFFFFF` | Default background |
| Background Off-White | `#FAFAFA` | Subtle background |
| Background Warm | `#F5F5F5` | Card backgrounds |

---

## SVG Variants

| File | Description | Use Case |
|---|---|---|
| `compass-icon.svg` | Master full-color version | Primary usage, all digital contexts |
| `compass-icon-color.svg` | Explicit full-color variant | Identical to master; for tooling that requires separate color file |
| `compass-icon-mono.svg` | Monochrome Deep Navy | Single-color print, watermarks, simplified contexts |
| `compass-icon-outline.svg` | Stroke only, no fill | Embossing, laser engraving, reversed overlays |

---

## Sizes & Formats

### Favicon
| Size | File |
|---|---|
| 16 × 16 px | `png/favicon/favicon-16.png` |
| 32 × 32 px | `png/favicon/favicon-32.png` |
| 64 × 64 px | `png/favicon/favicon-64.png` |
| Multi-size | `web/favicon.ico` |

### iOS App Icons
| Size | File |
|---|---|
| 76 × 76 px | `png/ios/icon-76.png` |
| 120 × 120 px | `png/ios/icon-120.png` |
| 152 × 152 px | `png/ios/icon-152.png` |
| 180 × 180 px | `png/ios/icon-180.png` |

### Android App Icons
| Size | File |
|---|---|
| 48 × 48 px | `png/android/android-icon-48.png` |
| 72 × 72 px | `png/android/android-icon-72.png` |
| 96 × 96 px | `png/android/android-icon-96.png` |
| 144 × 144 px | `png/android/android-icon-144.png` |
| 192 × 192 px | `png/android/android-icon-192.png` |
| 192 × 192 px (round) | `png/android/android-icon-192-round.png` |

### Web Icons
| Size | File |
|---|---|
| 16–512 px | `png/web/icon-{size}.png` |

### Social Media
| Format | Size | File |
|---|---|---|
| Profile picture | 400 × 400 px | `png/social/profile-400.png` |
| Instagram square | 1080 × 1080 px | `png/social/instagram-1080.png` |

### Print
| Format | File |
|---|---|
| 2400 × 2400 px PNG | `png/print/print-2400.png` |

---

## Design Principles

### Recognizability
The symbol must remain legible and distinctive at 16 × 16 px. The six arrows are the primary recognizable element; structural lines (hexagon, radials) should be reduced or removed at small sizes.

### Accessibility
- Minimum contrast ratio: 4.5:1 against white background for primary blue
- All three domain colors are distinguishable under most common color-vision deficiencies
- Monochrome version is available for full accessibility

### Scalability
- Always use the SVG master for digital contexts
- Use PNG raster assets only when SVG is not supported
- Never stretch or distort the symbol asymmetrically

### Clear Space
Maintain a minimum clear space of 10% of the symbol's total width on all four sides.

---

## Generating PNG Assets

Install [Inkscape](https://inkscape.org/) (recommended) and run the provided generation script:

```bash
# Using Inkscape (recommended for accuracy)
inkscape --export-type=png --export-width=192 --export-filename=png/android/android-icon-192.png svg/compass-icon.svg
```

A convenience script for batch generation is provided at `scripts/generate-icons.sh`.
