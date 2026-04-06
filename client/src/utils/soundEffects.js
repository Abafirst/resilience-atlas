/**
 * soundEffects.js — Web Audio API sound utilities for gamification celebrations.
 * No external audio files required; all sounds are synthesised programmatically.
 * Silently no-ops when the Web Audio API is unavailable or user interaction
 * has not yet occurred (browser autoplay policy).
 */

function getAudioContext() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    return AudioCtx ? new AudioCtx() : null;
  } catch (_) {
    return null;
  }
}

/**
 * Plays a short ascending celebratory chime — used for badge unlocks.
 * Four-note arpeggio: C5 → E5 → G5 → C6
 */
export function playBadgeUnlockSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 1046.50];
  const volume = 0.3;
  notes.forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
    osc.start(start);
    osc.stop(start + 0.45);
  });
}

/**
 * Plays a level-up fanfare — two ascending chords.
 * Used when reaching a new tier or completing a pathway.
 */
export function playLevelUpSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const chords = [
    [261.63, 329.63, 392.00],   // C4 major chord
    [523.25, 659.25, 783.99],   // C5 major chord (octave up)
  ];
  const volume = 0.25;
  chords.forEach((chord, ci) => {
    chord.forEach(freq => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = ctx.currentTime + ci * 0.22;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.start(start);
      osc.stop(start + 0.55);
    });
  });
}

/**
 * Plays a streak milestone notification — a double-pulse chime.
 * Used when the user hits a 7-day, 30-day, or 100-day streak.
 */
export function playStreakMilestoneSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const pulses = [440, 554.37]; // A4, C#5
  const volume = 0.28;
  pulses.forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.18;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
    osc.start(start);
    osc.stop(start + 0.5);
  });
}

/**
 * Plays a soft confirmation click — used when starting a pathway.
 */
export function playPathwayStartSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = 698.46; // F5
  const start = ctx.currentTime;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.22, start + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
  osc.start(start);
  osc.stop(start + 0.3);
}
