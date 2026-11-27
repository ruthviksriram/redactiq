import { useEffect } from 'react';

/**
 * Attaches lightweight 3D perspective tilt and specular glare highlights to cards.
 * Automatically respects prefers-reduced-motion.
 */
export function useCardTilt() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const handleMouseMove = (e) => {
      const target = e.target;
      if (!target || !target.closest) return;
      const card = target.closest('.tilt-card');
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Subtle tilt: max ~3.2 degrees
      const rotateX = ((y - centerY) / centerY) * -3.2;
      const rotateY = ((x - centerX) / centerX) * 3.2;

      card.style.setProperty('--tilt-rx', `${rotateX.toFixed(2)}deg`);
      card.style.setProperty('--tilt-ry', `${rotateY.toFixed(2)}deg`);
      card.style.setProperty('--glare-x', `${((x / rect.width) * 100).toFixed(1)}%`);
      card.style.setProperty('--glare-y', `${((y / rect.height) * 100).toFixed(1)}%`);
      card.style.setProperty('--glare-opacity', '1');
    };

    const handleMouseLeave = (e) => {
      const target = e.target;
      if (!target || !target.closest) return;
      const card = target.closest('.tilt-card');
      if (!card) return;

      card.style.setProperty('--tilt-rx', '0deg');
      card.style.setProperty('--tilt-ry', '0deg');
      card.style.setProperty('--glare-opacity', '0');
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseout', handleMouseLeave, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseout', handleMouseLeave);
    };
  }, []);
}

/**
 * Attaches mouse-following glow coordinates to interactive buttons.
 */
export function useButtonGlow() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e) => {
      const target = e.target;
      if (!target || !target.closest) return;
      const btn = target.closest('.btn');
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      btn.style.setProperty('--btn-x', `${x}px`);
      btn.style.setProperty('--btn-y', `${y}px`);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
}
