# Social Post Templates — The Resilience Atlas™

Evergreen, reusable social graphics for automated Metricool posts.  
Four template types × three color variants = **12 ready-to-use assets**.

---

## Template overview

| File prefix | Content type | Autolist | Label text |
|-------------|--------------|----------|------------|
| `micro-practice-` | 2-Minute Practice | Monday | "2-Minute Practice" |
| `dimension-` | Resilience Dimension spotlight | Wednesday | "Resilience Dimension" |
| `myth-truth-` | Myth → Truth reframe | Friday | "Myth / Truth" |
| `reflection-` | Weekly Reflection question | Sunday | "Weekly Reflection" |

Each prefix has three variants (`-01`, `-02`, `-03`) differing by accent color:

| Suffix | Accent color |
|--------|---------------|
| `-01` | Teal `#2A9D8F` |
| `-02` | Warm Sand `#E9C46A` |
| `-03` | Soft Coral `#E76F51` |

All templates render at **1080 × 1080 px**, are text-only (no logo required), and include the footer:

```
The Resilience Atlas™          theresilienceatlas.com
```

---

## File listing

```
social-templates/
├── README.md             ← this file
├── style-guide.md        ← colors, fonts, spacing, do/don't
├── svg/
│   ├── micro-practice-01.svg
│   ├── micro-practice-02.svg
│   ├── micro-practice-03.svg
│   ├── dimension-01.svg
│   ├── dimension-02.svg
│   ├── dimension-03.svg
│   ├── myth-truth-01.svg
│   ├── myth-truth-02.svg
│   ├── myth-truth-03.svg
│   ├── reflection-01.svg
│   ├── reflection-02.svg
│   └── reflection-03.svg
└── scripts/
    └── export-png.mjs    ← Node.js script to batch-convert SVG → PNG
```

---

## Exporting to PNG

### Option A — script (recommended for batching)

**Requirements**: Node.js 18+ and the `sharp` package.

```bash
# Install sharp (one-time)
npm install --save-dev sharp

# Run from the repo root
node social-templates/scripts/export-png.mjs
```

PNGs are written to `social-templates/png/` at 1080 × 1080 px.

> **Note**: `sharp` uses libvips for rasterisation. SVG fonts (DM Serif Display,
> Inter) fall back to system fonts unless you install them locally. For exact
> brand typography, use the Inkscape/browser method below.

### Option B — browser (no dependencies, exact fonts)

1. Open any `.svg` file in **Google Chrome** or **Firefox**.
2. Press **Ctrl + P** / **Cmd + P** → set paper size to *Custom 1080 × 1080* and print to PDF.
3. Open the PDF in **Preview** (macOS) or **Adobe Acrobat** and export as PNG at 150+ dpi.

### Option C — Inkscape (free, precise)

1. Download [Inkscape](https://inkscape.org) (free).
2. Install DM Serif Display and Inter fonts on your system.
3. Open an SVG → **File → Export PNG Image** → set width/height to 1080 × 1080.
4. Click **Export**.

Batch via command line:

```bash
for f in social-templates/svg/*.svg; do
  inkscape --export-type=png --export-width=1080 --export-height=1080 \
    --export-filename="social-templates/png/$(basename "${f%.svg}").png" "$f"
done
```

### Option D — Canva (no-code)

1. Open Canva → **Create design → Custom size → 1080 × 1080**.
2. Upload the SVG (Import → Upload file).
3. Adjust fonts if needed (replace fallbacks with DM Serif Display + Inter from Canva's font library).
4. **Download → PNG**.

---

## Fonts

The SVGs use these font stacks:

| Role | Primary | Fallback |
|------|---------|---------|
| Headlines | DM Serif Display | Georgia, Times New Roman, serif |
| Labels / body | Inter | Source Sans 3, Arial, sans-serif |

**To get exact brand typography**, install DM Serif Display and Inter on your system before exporting.  
Both are free on [Google Fonts](https://fonts.google.com).

---

## Using templates with Metricool Autolists

### One-time setup per Autolist

1. Export the three matching PNGs (e.g. `micro-practice-01.png`, `-02.png`, `-03.png`).
2. Open Metricool → **Autolists** → select the relevant autolist.
3. For posts 1, 4, 7 … attach `*-01.png`.
4. For posts 2, 5, 8 … attach `*-02.png`.
5. For posts 3, 6, 9 … attach `*-03.png`.
6. Enable **Repeat = On**.

This creates an automatic image rotation so the feed never shows the same visual twice in a row.

### Rotation cheat sheet

| Post # in autolist | Image to attach |
|--------------------|-----------------|
| 1, 4, 7, 10 … | `<type>-01.png` (Teal variant) |
| 2, 5, 8, 11 … | `<type>-02.png` (Sand variant) |
| 3, 6, 9, 12 … | `<type>-03.png` (Coral variant) |

Replace `<type>` with `micro-practice`, `dimension`, `myth-truth`, or `reflection`.

### Per-autolist assignment

| Autolist | Files to rotate |
|----------|----------------|
| Micro-practice (Mon) | `micro-practice-01/02/03.png` |
| Dimension spotlight (Wed) | `dimension-01/02/03.png` |
| Myth → Truth (Fri) | `myth-truth-01/02/03.png` |
| Weekly Reflection (Sun) | `reflection-01/02/03.png` |

---

## Customizing the templates

The SVGs are plain XML — open any file in a text editor or vector editor and change:

| Element | What to update |
|---------|---------------|
| `<text>` inside the main title area | Your actual post title / question |
| `<text>` bullet lines | Your specific bullet copy |
| Accent color (`#2A9D8F` / `#E9C46A` / `#E76F51`) | Find & replace to use a different color |
| Footer URL | Replace `theresilienceatlas.com` with your custom domain if needed |

All templates follow the brand rules in [`style-guide.md`](./style-guide.md).

---

## Design notes

- **Theme**: Atlas / Navigation / Compass. Every template has a faint compass rose motif and, where appropriate, a subtle map-grid background — referencing the Resilience Atlas metaphor without needing a logo.
- **Hierarchy**: Large serif headline → thin accent divider → concise body → consistent footer.
- **Whitespace**: generous; resist the urge to add more text.
- **Accessibility**: Each SVG includes a `<title>` element for screen readers.
