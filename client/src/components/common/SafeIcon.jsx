/**
 * SafeIcon.jsx
 * Shared utility component for rendering SVG icons with emoji fallback.
 *
 * If the SVG fails to load (missing file, network error), an emoji fallback
 * is rendered in its place — preventing broken image icons in the UI.
 */

import React from 'react';

/**
 * @param {object} props
 * @param {string}  props.src            - Path to the SVG icon (e.g. '/icons/trophy.svg')
 * @param {string}  [props.fallbackEmoji] - Emoji to show when the SVG fails to load
 * @param {string}  [props.alt]           - Accessible alt text; omit or pass '' for decorative icons
 * @param {string}  [props.className]     - CSS class(es) to apply to the img element
 * @param {object}  [props.style]         - Inline styles to apply to both img and fallback span
 */
export default function SafeIcon({ src, fallbackEmoji = '📌', alt = '', className = '', style = {} }) {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <span
        aria-hidden="true"
        style={{ fontSize: style.width || 14, lineHeight: 1, ...style }}
      >
        {fallbackEmoji}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={!alt || undefined}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
