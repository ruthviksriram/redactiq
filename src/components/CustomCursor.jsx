import { useEffect, useRef, useState } from 'react';

/**
 * Custom cursor component featuring a smooth easing trailing ring and pinpoint dot.
 * Fully compliant with fine-pointer (@media (hover: hover) and (pointer: fine))
 * and disabled under prefers-reduced-motion.
 *
 * @returns {JSX.Element|null} The custom cursor DOM elements.
 */
export default function CustomCursor() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isTextTarget, setIsTextTarget] = useState(false);

  const dotRef = useRef(null);
  const ringRef = useRef(null);

  // Mutable animation state (no React re-renders for 60fps)
  const stateRef = useRef({
    mouseX: -100,
    mouseY: -100,
    ringX: -100,
    ringY: -100,
    visible: false,
    rafId: null,
  });

  useEffect(() => {
    // Only enable on desktop devices with a fine pointer and when motion is allowed
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasFinePointer || prefersReducedMotion) {
      return;
    }

    setIsEnabled(true);

    const state = stateRef.current;

    const handleMouseMove = (e) => {
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;

      if (!state.visible) {
        state.visible = true;
        state.ringX = e.clientX;
        state.ringY = e.clientY;
      }

      // Pinpoint dot follows immediately without lag
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Check if hovering over interactive elements
      const target = e.target;
      if (target && target.closest) {
        const interactive = target.closest(
          'button, a, input, select, .btn, .mode-button, .entity-toggle-pill, .file-badge-remove, [role="button"], [role="radio"]'
        );
        setIsHovered(Boolean(interactive));

        // Keep standard text cursor inside text inputs, code view, and output panels
        const textTarget = target.closest(
          'textarea, input[type="text"], .text-input-area, .highlighted-content-scroll, .panel-body'
        );
        setIsTextTarget(Boolean(textTarget));
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseLeave = () => {
      state.visible = false;
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };

    const handleMouseEnter = () => {
      state.visible = true;
      if (dotRef.current) dotRef.current.style.opacity = '1';
      if (ringRef.current) ringRef.current.style.opacity = '1';
    };

    // Smooth RAF loop for the trailing ring (lerp with easing)
    const animate = () => {
      if (state.visible && ringRef.current) {
        const ease = 0.18;
        state.ringX += (state.mouseX - state.ringX) * ease;
        state.ringY += (state.mouseY - state.ringY) * ease;

        ringRef.current.style.transform = `translate3d(${state.ringX}px, ${state.ringY}px, 0)`;
      }
      state.rafId = requestAnimationFrame(animate);
    };

    state.rafId = requestAnimationFrame(animate);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      cancelAnimationFrame(state.rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  if (!isEnabled) {
    return null;
  }

  const cursorClass = [
    'custom-cursor-container',
    isHovered ? 'cursor-hovered' : '',
    isClicking ? 'cursor-clicking' : '',
    isTextTarget ? 'cursor-text-target' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cursorClass} aria-hidden="true">
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </div>
  );
}
