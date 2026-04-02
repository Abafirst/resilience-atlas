import React from 'react';

/**
 * GameCard — Reusable game selector card for the KidsGamesHub.
 */
export default function GameCard({ game, onPlay }) {
  return (
    <div
      className="kg-game-card"
      style={{ '--card-color': game.color, '--card-accent': game.accentColor }}
    >
      <div className="kg-game-card-emoji" aria-hidden="true">{game.emoji}</div>
      <div className="kg-game-card-age">{game.ageRange}</div>
      <h3 className="kg-game-card-title">{game.title}</h3>
      <p className="kg-game-card-desc">{game.description}</p>
      <button
        className="kg-game-card-btn"
        onClick={() => onPlay(game.id)}
        aria-label={`Play ${game.title}`}
      >
        {game.cta}
      </button>
    </div>
  );
}
