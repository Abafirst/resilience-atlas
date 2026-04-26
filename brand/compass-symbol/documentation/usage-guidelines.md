# Resilience Atlas Compass Symbol — Usage Guidelines

## Correct Usage

### Do ✅

- Use the full-color SVG master (`compass-icon.svg`) as the primary icon in all digital contexts
- Maintain equal width and height (the symbol is square; never display it in a non-square bounding box)
- Place on white (`#FFFFFF`), off-white (`#FAFAFA`), or very light neutral backgrounds for maximum clarity
- Use the monochrome variant (`compass-icon-mono.svg`) in single-color print contexts
- Use the outline variant (`compass-icon-outline.svg`) for embossing, engraving, or reversed overlays on colored backgrounds
- Allow a minimum clear-space equal to 10% of the icon width on every side
- Reference the `site.webmanifest` file from your HTML `<head>` for progressive web app icon support

### Don't ❌

- Do not alter the proportions, rotation, or spacing of the six arrows
- Do not change the assigned colors of individual arrows (color is meaningful — each domain has a defined hue)
- Do not add extra arrows, remove arrows, or merge domains
- Do not apply gradients, textures, or patterns to the arrows (domain colors are flat)
- Do not place the icon on busy photographic backgrounds without sufficient contrast
- Do not display the icon smaller than 16 × 16 px in raster form; use SVG below 32 px for best quality
- Do not apply drop shadows to the outer circle
- Do not stretch, skew, or distort the icon

---

## color Contexts

### Light Backgrounds (Default)
Use the full-color master SVG. The light radial background gradient included in the master provides gentle separation from pure-white pages.

### Dark Backgrounds
Use the outline variant with `stroke` colors changed to white (`#FFFFFF`) or light neutral (`#F5F5F5`). A white monochrome variant can be produced by overriding the SVG `fill` and `stroke` attributes via CSS:

```css
.compass-icon path,
.compass-icon circle,
.compass-icon polygon {
  fill: #FFFFFF;
  stroke: #FFFFFF;
}
```

### colored Backgrounds
Use the outline variant (`compass-icon-outline.svg`). Ensure sufficient contrast between the stroke color and the background color (minimum 4.5:1 contrast ratio).

---

## HTML Integration

### Favicon (Browser Tab)

```html
<link rel="icon" type="image/svg+xml" href="/brand/compass-symbol/svg/compass-icon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/brand/compass-symbol/png/favicon/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/brand/compass-symbol/png/favicon/favicon-16.png">
```

### Apple Touch Icon (iOS Home Screen)

```html
<link rel="apple-touch-icon" sizes="180x180" href="/brand/compass-symbol/png/ios/icon-180.png">
```

### Web App Manifest

```html
<link rel="manifest" href="/brand/compass-symbol/web/site.webmanifest">
<meta name="theme-color" content="#1565C0">
```

### Inline SVG (for CSS animation or hover effects)

```html
<svg class="compass-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" aria-label="Resilience Atlas">
  <!-- paste contents of compass-icon.svg here -->
</svg>
```

---

## CSS Styling Examples

### Animated Rotation (subtle, 20-second cycle)

```css
.compass-icon {
  animation: compass-spin 20s linear infinite;
  transform-origin: center;
}

@keyframes compass-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

### Hover Glow Effect

```css
.compass-icon {
  transition: filter 0.3s ease;
}
.compass-icon:hover {
  filter: drop-shadow(0 0 8px rgba(21, 101, 192, 0.45));
}
```

### Responsive Sizing

```css
.compass-icon {
  width: clamp(32px, 5vw, 96px);
  height: auto;
}
```

### Dark Mode Adaptation

```css
@media (prefers-color-scheme: dark) {
  /* Target by semantic ID (added to master SVG elements) */
  #compass-boundary { stroke: #90CAF9; }
  #compass-center   { fill: #90CAF9; }
}
```

---

## Print Guidelines

### Minimum Print Size
- Full-color: 15 mm × 15 mm minimum
- Monochrome: 10 mm × 10 mm minimum
- Outline: 12 mm × 12 mm minimum

### CMYK Conversion (approximate)

| Brand color | Hex | CMYK |
|---|---|---|
| Deep Navy | `#1565C0` | C:89 M:67 Y:0 K:25 |
| Muted Purple | `#6A4C93` | C:28 M:48 Y:0 K:42 |
| Soft Teal | `#0097A7` | C:100 M:10 Y:0 K:35 |

### High-Resolution Print
Use `png/print/print-2400.png` (2400 × 2400 px, 300 DPI equivalent) for physical print materials.

---

## Brand Consistency

The Resilience Atlas compass symbol should always appear alongside the logotype "The Resilience Atlas" in primary brand contexts. Maintain the visual relationship:

- **Website header:** Compass icon left of logotype, separated by 12 px minimum
- **Social media profile:** Compass icon centerd, no logotype required
- **Business cards:** Compass icon top-right or centered on reverse
- **Report headers:** Compass icon top-left with logotype, consistent with website header

---

## Accessibility Notes

- The SVG master already includes `<title>`, `<desc>`, `role="img"`, and `aria-labelledby` attributes — preserve these when embedding the SVG inline
- When using `<img src="...">` instead of inline SVG, add `alt="Resilience Atlas compass icon"` to the `<img>` tag
- The three domain colors meet WCAG AA contrast requirements against white backgrounds
- For critical UI contexts, use the Deep Navy (`#1565C0`) monochrome version which offers the highest contrast

---

## Questions and Brand Requests

For variations not covered here (co-branding, white-label adaptations, animated versions), consult the design team before creating new variants. Unauthorized color or structural modifications dilute brand consistency and compromise the symbol's semantic meaning.
