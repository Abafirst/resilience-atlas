/**
 * FavoriteButton.jsx
 * Reusable heart-icon button for toggling an activity as a favorite.
 *
 * Props:
 *   activityId  {string}           – Unique identifier of the activity
 *   isFavorited {boolean}          – Current favorite state
 *   onToggle    {(id: string)=>void} – Callback to toggle the favorite
 *   size        {'small'|'medium'|'large'} – Button size (default: 'medium')
 */

import React from 'react';

const SIZES = {
  small:  { fontSize: '1rem',    padding: '.25rem' },
  medium: { fontSize: '1.25rem', padding: '.35rem' },
  large:  { fontSize: '1.5rem',  padding: '.45rem' },
};

export default function FavoriteButton({
  activityId,
  isFavorited = false,
  onToggle,
  size = 'medium',
}) {
  const sz = SIZES[size] || SIZES.medium;

  function handleClick(e) {
    e.stopPropagation(); // prevent card expansion when inside a card
    if (onToggle) onToggle(activityId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFavorited}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: sz.padding,
        fontSize: sz.fontSize,
        lineHeight: 1,
        borderRadius: '50%',
        transition: 'transform .15s, opacity .15s',
        opacity: isFavorited ? 1 : 0.55,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = isFavorited ? '1' : '0.55'; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {isFavorited ? '❤️' : '🤍'}
    </button>
  );
}
