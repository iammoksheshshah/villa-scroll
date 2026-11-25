'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect } from 'react';

/**
 * Scroll-driven entrance states. Each element opts in with `data-animate` and
 * is revealed once, when its top edge passes 88% of the viewport. Rotations
 * are expressed in a perspective so cards settle out of depth rather than
 * simply sliding in.
 */
const presets: Record<string, gsap.TweenVars> = {
  rise: { y: 54, autoAlpha: 0 },
  fade: { y: 22, autoAlpha: 0, filter: 'blur(8px)' },
  depth: {
    y: 90,
    z: -140,
    rotateX: 12,
    scale: 0.97,
    autoAlpha: 0,
    transformPerspective: 1400,
    transformOrigin: '50% 100%',
  },
  card: {
    y: 80,
    z: -160,
    rotateX: 10,
    rotateY: -7,
    scale: 0.95,
    autoAlpha: 0,
    transformPerspective: 1400,
    transformOrigin: '50% 100%',
  },
};

export default function ScrollAnimator() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Reduced-motion visitors get the finished layout, with no hidden states.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-animate]').forEach((element) => {
        const preset = presets[element.dataset.animate ?? 'rise'] ?? presets.rise;
        const delay = Number(element.dataset.delay ?? 0);

        gsap.from(element, {
          ...preset,
          duration: 1.25,
          delay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 88%',
            once: true,
          },
        });
      });

      // Slow vertical drift inside clipped media for a parallax depth cue.
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((element) => {
        const strength = Number(element.dataset.parallax ?? 6);

        gsap.fromTo(
          element,
          { yPercent: -strength, scale: 1.16 },
          {
            yPercent: strength,
            scale: 1.06,
            ease: 'none',
            scrollTrigger: {
              trigger: element,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.6,
            },
          }
        );
      });
    });

    // Fonts and images settle after mount; recalculate the trigger positions.
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 400);

    return () => {
      window.clearTimeout(refresh);
      context.revert();
    };
  }, []);

  return null;
}
