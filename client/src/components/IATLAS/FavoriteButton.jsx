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

import React, { useState } from 'react';

const BTN_STYLES = `
  .fav-btn {
    background: none;
    border: none;
    cursor: pointer;
    line-height: 1;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform .15s, opacity .15s;
  }

  .fav-btn--small  { font-size: 1rem;    padding: .25rem; }
  .fav-btn--medium { font-size: 1.25rem; padding: .35rem; }
  .fav-btn--large  { font-size: 1.5rem;  padding: .45rem; }

  .fav-btn--unfavorited { opacity: 0.55; }
  .fav-btn--favorited   { opacity: 1; }

  .fav-btn:hover,
  .fav-btn:focus-visible {
    opacity: 1;
    transform: scale(1.15);
    outline: none;
  }
`;

export default function FavoriteButton({
  activityId,
  isFavorited = false,
  onToggle,
  size = 'medium',
}) {
  function handleClick(e) {
    e.stopPropagation(); // prevent card expansion when inside a card
    if (onToggle) onToggle(activityId);
  }

  return (
    <>
      <style>{BTN_STYLES}</style>
      <button
        type="button"
        onClick={handleClick}
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={isFavorited}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        className={`fav-btn fav-btn--${size} ${isFavorited ? 'fav-btn--favorited' : 'fav-btn--unfavorited'}`}
      >
        {isFavorited ? '❤️' : '🤍'}
      </button>
    </>
  );
}
