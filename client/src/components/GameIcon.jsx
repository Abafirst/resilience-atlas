import React from 'react';

/**
 * GameIcon — Reusable branded icon component for gamification pages.
 *
 * Renders an SVG icon from /icons/games/ with consistent sizing,
 * earned/locked visual states, and optional premium styling.
 *
 * @param {string}  name      - Icon filename without .svg (e.g. "compass-spinner")
 * @param {string}  size      - 'sm' | 'md' | 'lg' | 'xl'  (default: 'md')
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
  const px = sizeMap[size] ?? 24;

  const classes = [
    'game-icon',
    earned ? 'game-icon--earned' : 'game-icon--locked',
    premium ? 'game-icon--premium' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <img
      src={`/icons/games/${name}.svg`}
      alt={alt ?? name.replace(/-/g, ' ')}
      width={px}
      height={px}
      className={classes}
      loading="lazy"
    />
  );
}
