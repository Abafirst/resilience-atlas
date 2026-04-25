/**
 * CelebrationConfetti.jsx
 * Wrapper component that triggers confetti on mount when active=true.
 * Returns no DOM output (null).
 */

import { useEffect, useRef } from 'react';
import { launchConfetti } from '../../utils/confettiAnimation.js';

export default function CelebrationConfetti({ active, onComplete, count = 120, duration = 2500 }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;

    launchConfetti({ count, duration });

    if (onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [active, count, duration, onComplete]);

  return null;
}
