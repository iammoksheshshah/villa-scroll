'use client';

import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import type { InteriorStop } from './interior-timeline';

type ProgressNavProps = {
  stops: InteriorStop[];
  activeIndex: number;
  onSelect: (stop: InteriorStop) => void;
};

export default function ProgressNav({ stops, activeIndex, onSelect }: ProgressNavProps) {
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [inSequence, setInSequence] = useState(true);

  // The nav belongs to the pinned sequence; hide it once the sequence scrolls
  // away so it does not sit on top of the page sections. This is measured on
  // scroll rather than with IntersectionObserver: the pin is transform-based,
  // so intersection events never fire as the section unpins.
  useEffect(() => {
    const sequence = document.getElementById('sequence');
    if (!sequence) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = sequence.getBoundingClientRect();
      setInSequence(rect.bottom > 8 && rect.top < window.innerHeight - 8);
    };
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  useEffect(() => {
    lineRefs.current.forEach((line, index) => {
      if (!line) return;
      const active = index === activeIndex;
      gsap.to(line, {
        scaleY: active ? 1 : 0.3,
        opacity: active ? 1 : 0.35,
        duration: 0.55,
        ease: 'power3.out',
        overwrite: 'auto',
      });

      const label = labelRefs.current[index];
      if (label) {
        gsap.to(label, {
          opacity: active ? 1 : 0.4,
          duration: 0.55,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      }
    });
  }, [activeIndex]);

  useEffect(
    () => () => {
      lineRefs.current.forEach((line) => line && gsap.killTweensOf(line));
      labelRefs.current.forEach((label) => label && gsap.killTweensOf(label));
    },
    []
  );

  return (
    <nav
      aria-label="Interior timeline"
      aria-hidden={!inSequence}
      className={`fixed right-4 top-1/2 z-40 -translate-y-1/2 transition-opacity duration-500 md:right-10 ${
        inSequence ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <ul className="flex flex-col items-end gap-4">
        {stops.map((stop, index) => (
          <li key={stop.id}>
            <button
              type="button"
              onClick={() => onSelect(stop)}
              tabIndex={inSequence ? undefined : -1}
              aria-label={`Go to ${stop.title}`}
              aria-current={index === activeIndex ? 'step' : undefined}
              className="group flex items-center gap-3 outline-none"
            >
              <span
                ref={(element) => {
                  labelRefs.current[index] = element;
                }}
                className="hidden whitespace-nowrap text-[9px] font-light uppercase tracking-[0.22em] text-white/60 opacity-40 transition-colors duration-300 group-hover:text-white md:inline"
              >
                {stop.title}
              </span>
              <span className="relative flex h-6 w-px items-center justify-center">
                <span
                  ref={(element) => {
                    lineRefs.current[index] = element;
                  }}
                  className="h-full w-px origin-center scale-y-30 bg-white"
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
