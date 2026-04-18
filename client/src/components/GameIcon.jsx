import React, { useEffect, useMemo, useState } from 'react';

const gameIconCache = new Map();
const KEEP_PAINT_VALUES = new Set(['none', 'currentcolor', 'inherit']);
const GAME_ICON_NAME_RE = /^[a-z0-9-]+$/i;

function sanitizeGameSvg(rawSvg) {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return null;

  const parserError = doc.querySelector('parsererror');
  if (parserError) return null;

  svg.querySelectorAll('script, foreignObject, iframe, object, embed, link, style').forEach((node) => node.remove());

  const paintAttrs = ['fill', 'stroke'];
  const allNodes = [svg, ...svg.querySelectorAll('*')];

  allNodes.forEach((node) => {
    [...node.attributes].forEach((attr) => {
      const attrName = attr.name.toLowerCase();
      const attrValue = attr.value.trim();

      if (attrName.startsWith('on')) {
        node.removeAttribute(attr.name);
        return;
      }

      if (attrName === 'style') {
        node.removeAttribute(attr.name);
        return;
      }

      if ((attrName === 'href' || attrName === 'xlink:href') && /^(javascript:|data:)/i.test(attrValue)) {
        node.removeAttribute(attr.name);
        return;
      }

      if (paintAttrs.includes(attrName)) {
        const normalized = attrValue.toLowerCase();
        if (!KEEP_PAINT_VALUES.has(normalized) && !normalized.startsWith('url(')) {
          node.setAttribute(attr.name, 'currentColor');
        }
      }
    });
  });

  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('aria-hidden', 'true');

  return svg.outerHTML;
}

async function loadGameSvg(name) {
  if (!GAME_ICON_NAME_RE.test(name)) {
    throw new Error('Invalid game icon name');
  }

  const cached = gameIconCache.get(name);
  if (cached) return cached;

  // Security assumption: /icons/games is application-owned static content.
  // If this path ever serves user-supplied SVG, add server-side sanitization.
  const promise = fetch(`./icons/games/${name}.svg`)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load icon: ${name}`);
      return res.text();
    })
    .then((svgText) => sanitizeGameSvg(svgText))
    .catch((err) => {
      gameIconCache.delete(name);
      throw err;
    });

  gameIconCache.set(name, promise);
  return promise;
}

function GameIconFallback({ label, className, px }) {
  return (
    <span
      className={className}
      style={{ width: px, height: px }}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : 'true'}
    >
      <InlineFallbackSvg />
    </span>
  );
}

function InlineFallbackSvg() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </svg>
  );
}

/**
 * GameIcon — Reusable branded icon component for gamification pages.
 *
 * Renders an SVG icon from /icons/games/ with consistent sizing,
 * earned/locked visual states, and optional premium styling.
 *
 * @param {string}  name      - Icon filename without .svg (e.g. "compass-spinner")
 * @param {string|number} size - 'sm' | 'md' | 'lg' | 'xl' or px number (default: 'md')
 * @param {boolean} earned    - When false the icon is rendered in locked/grayscale state
 * @param {boolean} premium   - Adds a gold glow for premium/enterprise indicators
 * @param {string}  alt       - Alt text override (defaults to name)
 * @param {string}  className - Extra CSS classes
 */
export default function GameIcon({
  name,
  size = 'md',
  earned = true,
  premium = false,
  alt,
  className = '',
}) {
  const sizeMap = { sm: 16, md: 24, lg: 32, xl: 48 };
  const px = typeof size === 'number' ? size : (sizeMap[size] ?? 24);
  const safeName = useMemo(() => (typeof name === 'string' && GAME_ICON_NAME_RE.test(name) ? name : null), [name]);
  const [inlineSvg, setInlineSvg] = useState(null);
  const [hasError, setHasError] = useState(false);
  const iconLabel = alt ?? (safeName ? safeName.replace(/-/g, ' ') : 'Game icon');

  const classes = [
    'game-icon',
    earned ? 'game-icon--earned' : 'game-icon--locked',
    premium ? 'game-icon--premium' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    let active = true;
    setInlineSvg(null);
    setHasError(false);

    if (!safeName) {
      setHasError(true);
      return () => {
        active = false;
      };
    }

    loadGameSvg(safeName)
      .then((sanitized) => {
        if (!active) return;
        if (!sanitized) {
          setHasError(true);
          return;
        }
        setInlineSvg(sanitized);
      })
      .catch(() => {
        if (active) setHasError(true);
      });

    return () => {
      active = false;
    };
  }, [safeName]);

  if (hasError) {
    return <GameIconFallback label={iconLabel} className={classes} px={px} />;
  }

  return (
    <span
      className={classes}
      style={{ width: px, height: px }}
      role={iconLabel ? 'img' : undefined}
      aria-label={iconLabel || undefined}
      aria-hidden={iconLabel ? undefined : 'true'}
    >
      {inlineSvg
        ? (
            // Safe usage: sanitizeGameSvg removes active content and this source is app-owned /icons/games assets.
            <span className="game-icon__svg" dangerouslySetInnerHTML={{ __html: inlineSvg }} />
          )
        : <InlineFallbackSvg />}
    </span>
  );
}
