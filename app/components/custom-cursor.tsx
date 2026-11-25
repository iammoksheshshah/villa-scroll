'use client';

import gsap from 'gsap';
import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    const root = document.documentElement;
    gsap.set([ring, dot], { xPercent: -50, yPercent: -50, opacity: 0 });

    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });

    let visible = false;

    const onMove = (event: MouseEvent) => {
      if (!visible) {
        visible = true;
        // Hide the native pointer only once the custom one is positioned, so
        // there is never a frame with no cursor at all.
        root.classList.add('custom-cursor-active');
        gsap.to([ring, dot], { opacity: 1, duration: 0.4, ease: 'power2.out' });
      }
      ringX(event.clientX);
      ringY(event.clientY);
      dotX(event.clientX);
      dotY(event.clientY);
    };

    const onOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest(
        'a, button, label, select, textarea, input, [role="button"], [data-cursor="hover"]'
      );
      gsap.to(ring, {
        scale: interactive ? 1.7 : 1,
        borderColor: interactive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
        duration: 0.4,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    };

    const onLeave = () => {
      // Reset so the next mousemove inside the page fades both back in.
      visible = false;
      gsap.to([ring, dot], { opacity: 0, duration: 0.3, ease: 'power2.out' });
    };

    // Alt-tabbing freezes the ring at its last position; hand the pointer back
    // to the OS instead of leaving a stale ring and no visible cursor.
    const onBlur = () => {
      visible = false;
      root.classList.remove('custom-cursor-active');
      gsap.set([ring, dot], { opacity: 0 });
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    window.addEventListener('blur', onBlur);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('mouseleave', onLeave);
      root.classList.remove('custom-cursor-active');
      gsap.killTweensOf([ring, dot]);
    };
  }, []);

  return (
    // Difference blending keeps the white cursor visible on both the dark
    // imagery and the light theme without tracking the theme in JS.
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] mix-blend-difference"
    >
      <div ref={ringRef} className="absolute left-0 top-0 h-8 w-8 rounded-full border border-white/70" />
      <div ref={dotRef} className="absolute left-0 top-0 h-1 w-1 rounded-full bg-white" />
    </div>
  );
}
