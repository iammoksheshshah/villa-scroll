'use client';

import gsap from 'gsap';
import { useEffect, useRef, type ReactNode } from 'react';

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees at the card edge. */
  max?: number;
};

/**
 * Wraps content in a perspective stage and tilts it toward the pointer.
 * The pointer position is also exposed as --mx/--my so children can paint a
 * light glare without any extra React state.
 */
export default function TiltCard({ children, className = '', max = 7 }: TiltCardProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rotateX = gsap.quickTo(inner, 'rotationX', { duration: 0.8, ease: 'power3.out' });
    const rotateY = gsap.quickTo(inner, 'rotationY', { duration: 0.8, ease: 'power3.out' });

    const handleMove = (event: PointerEvent) => {
      const rect = frame.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      rotateY((x - 0.5) * max * 2);
      rotateX((0.5 - y) * max * 2);
      frame.style.setProperty('--mx', `${x * 100}%`);
      frame.style.setProperty('--my', `${y * 100}%`);
    };

    const handleLeave = () => {
      rotateX(0);
      rotateY(0);
    };

    frame.addEventListener('pointermove', handleMove);
    frame.addEventListener('pointerleave', handleLeave);

    return () => {
      frame.removeEventListener('pointermove', handleMove);
      frame.removeEventListener('pointerleave', handleLeave);
      gsap.killTweensOf(inner);
    };
  }, [max]);

  return (
    <div ref={frameRef} className={`tilt-card [perspective:1400px] ${className}`}>
      <div
        ref={innerRef}
        className="h-full [transform-style:preserve-3d] will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}
