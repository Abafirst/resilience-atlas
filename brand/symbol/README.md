# Resilience Atlas — Brand Symbol

Minimalist compass-inspired visual mark for The Resilience Atlas platform.

## Design Philosophy

| Principle | Implementation |
|---|---|
| **Minimalist** | Clean geometric lines, deliberate whitespace |
| **Compass-inspired** | Cardinal markers represent psychological navigation |
| **Circular** | Outer ring signifies wholeness and containment |
| **Modern Professional** | Contemporary geometric aesthetic |
| **Scalable** | SVG master; works 16 px → poster |

## Color Palette

| Role | Hex | Name |
|---|---|---|
| Primary | `#1565C0` | Deep Navy Blue |
| Secondary | `#0097A7` | Soft Teal |
| Tertiary | `#6A4C93` | Muted Purple |
| Neutral Dark | `#212121` | Near-Black |
| Neutral Mid | `#757575` | Mid-Grey |
| Neutral Light | `#E0E0E0` | Light Grey |

## File Structure

```
brand/symbol/
├── svg/
│   ├── symbol.svg          Master — full color (primary file)
│   ├── symbol-color.svg    Explicit full-color copy
│   ├── symbol-mono.svg     Monochrome dark (#212121) — light backgrounds
│   └── symbol-outline.svg  White outline — dark/colored backgrounds
├── web/
│   └── favicon.svg         Optimized favicon variant (heavier strokes)
└── css/
    └── symbol-styles.css   Base styles & utility classes
```

> **PNG files** are generated at build/deploy time from the SVG masters using
> `scripts/generate-brand-assets.js` (requires `sharp`).

## SVG Elements

Each master SVG (`viewBox="0 0 200 200"`, center `100 100`) contains:

1. **Outer circle** — r 91, `#1565C0`, stroke-width 1.75, opacity 0.75
2. **Inner ring** — r 58, `#0097A7`, stroke-width 1, opacity 0.22
3. **Inner hexagon** — `#0097A7`, opacity 0.18 (background structure)
4. **Cardinal markers** — N / E / S / W tick lines, `#1565C0`, stroke-width 2.5
5. **Ordinal dots** — NE / SE / SW / NW, `#E0E0E0`, r 2.2
6. **Central focal point** — r 8, radial gradient `#5C8FD6 → #1565C0`

## HTML Usage

### Favicon

```html
<head>
  <link rel="icon" href="/brand/symbol/web/favicon.svg" type="image/svg+xml">
  <!-- Fallback for older browsers: -->
  <link rel="icon" href="/favicon.ico" sizes="any">
</head>
```

### Inline SVG (recommended for interactive/animated use)

```html
<svg class="ra-symbol ra-symbol--medium" viewBox="0 0 200 200"
     aria-label="Resilience Atlas" role="img">
  <!-- paste SVG content here -->
</svg>
```

### Image Tag

```html
<img src="/brand/symbol/svg/symbol.svg"
     class="ra-symbol ra-symbol--medium"
     alt="Resilience Atlas">
```

### Logo Lockup

```html
<a class="ra-logo-lockup" href="/">
  <img src="/brand/symbol/svg/symbol.svg" class="ra-symbol" alt="">
  <span class="ra-logo-lockup__text">Resilience Atlas</span>
</a>
```

## CSS Classes

| Class | Description |
|---|---|
| `ra-symbol` | Base — fluid width, 1:1 aspect ratio, max 200 px |
| `ra-symbol--favicon` | 16 px |
| `ra-symbol--tiny` | 24 px |
| `ra-symbol--small` | 48 px |
| `ra-symbol--medium` | 128 px |
| `ra-symbol--large` | 256 px |
| `ra-symbol--xlarge` | 512 px |
| `ra-symbol--responsive` | 48 / 96 / 128 px at mobile / tablet / desktop |
| `ra-symbol--watermark` | Opacity 0.08, non-interactive |
| `ra-symbol--pulse` | Subtle 3 s scale pulse animation |
| `ra-symbol--rotate` | 30 s slow rotation |
| `ra-symbol--interactive` | Hover lift + shadow |
| `ra-symbol--padded` | 8 px clear space padding |

## Sizing Guidelines

| Context | Size |
|---|---|
| Favicon | 16 – 64 px |
| Header / nav | 36 – 48 px |
| App icon | 48 – 128 px |
| Email signature | 64 – 96 px |
| Report / PDF | 128 – 192 px |
| Social profile | 400 × 400 px |
| Print / signage | 512 px+ (use SVG directly) |

## Accessibility

- All SVG files include `role="img"` and `aria-label="Resilience Atlas"`.
- `<title>` element provides screen-reader text inside each SVG.
- color contrast: `#1565C0` on white = **4.6 : 1** (AA compliant).
- Symbol is recognisable without color (monochrome variant provided).

## Dark Mode

Use `symbol-outline.svg` on dark backgrounds, or apply the `.ra-symbol--light`
class to an inline SVG. The CSS file includes a `prefers-color-scheme: dark`
block for the logo lockup text.
