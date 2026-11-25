'use client';

import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

const scenes = [
  {
    no: '01',
    title: 'Morning',
    meta: 'Breakfast in the courtyard light',
    image: '/images/suite-living.jpg',
  },
  {
    no: '02',
    title: 'Afternoon',
    meta: 'The long table, opened to the garden',
    image: '/images/suite-bedroom.jpg',
  },
  {
    no: '03',
    title: 'Evening',
    meta: 'Water, candles, and the valley below',
    image: '/images/pool-dusk.jpg',
  },
];

const notes = [
  { label: 'Private chef', detail: 'On request, daily' },
  { label: 'House staff', detail: 'Discreet, resident' },
  { label: 'Arrival', detail: 'Car from the airport' },
];

/**
 * The Experience section: three photographs start fanned back into depth and
 * settle into a flat wall as the section scrolls through the viewport. The
 * headline is revealed word by word behind a mask.
 */
export default function ExperienceGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const deck = deckRef.current;
    if (!section || !deck) return;

    const context = gsap.context(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      gsap.from('[data-head-word]', {
        yPercent: 118,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        stagger: 0.06,
        scrollTrigger: { trigger: '[data-headline]', start: 'top 86%', once: true },
      });

      gsap.from('[data-experience-copy]', {
        y: 26,
        autoAlpha: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '[data-headline]', start: 'top 80%', once: true },
      });

      // Stacked on phones, so the deck keeps its depth but not the sideways fan.
      const compact = window.matchMedia('(max-width: 639px)').matches;
      const cards = gsap.utils.toArray<HTMLElement>('[data-deck-card]', deck);
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: deck,
          start: 'top 86%',
          end: 'top 28%',
          scrub: 0.9,
        },
        defaults: { ease: 'none' },
      });

      cards.forEach((card, index) => {
        const offset = index - (cards.length - 1) / 2;

        timeline.fromTo(
          card,
          {
            rotateY: offset * (compact ? 12 : 30),
            rotateX: compact ? 4 : 8,
            z: compact ? -180 : -300 - Math.abs(offset) * 50,
            x: compact ? 0 : offset * 76,
            y: compact ? 0 : Math.abs(offset) * 52,
            opacity: compact ? 0.4 : 0.35,
            transformPerspective: 1500,
          },
          {
            rotateY: 0,
            rotateX: 0,
            z: 0,
            x: 0,
            y: 0,
            opacity: 1,
            duration: 1,
          },
          index * 0.07
        );
      });
    }, section);

    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 400);

    return () => {
      window.clearTimeout(refresh);
      context.revert();
    };
  }, []);

  return (
    <section
      id="experience"
      ref={sectionRef}
      className="ambient-glow relative overflow-hidden border-t border-line bg-base px-5 py-24 sm:px-8 md:px-16 md:py-40"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] tracking-[0.24em] text-ink/35">03</span>
              <span className="h-px w-8 bg-ink/25" />
              <span className="text-[10px] font-light uppercase tracking-[0.34em] text-ink/45">
                Experience
              </span>
            </div>

            <h2
              data-headline
              className="mt-8 font-display text-[clamp(2.5rem,6vw,5.25rem)] font-light leading-[0.94] tracking-[-0.015em] text-ink"
            >
              {['A rhythm of', 'light', 'and shadow.'].map((line, lineIndex) => (
                <span key={line} className="block">
                  {line.split(' ').map((word, index) => (
                    <span
                      key={`${line}-${index}`}
                      className={`inline-block overflow-hidden pb-[0.08em] align-bottom ${
                        lineIndex === 1 ? 'italic text-ink/55' : ''
                      }`}
                    >
                      <span data-head-word className="inline-block pr-[0.24em]">
                        {word}
                      </span>
                    </span>
                  ))}
                </span>
              ))}
            </h2>
          </div>

          <div className="flex max-w-xs shrink-0 flex-col gap-5 md:items-end md:text-right">
            <p data-experience-copy className="text-xs font-light leading-relaxed text-ink/50">
              Days here are not scheduled. They are measured by the angle of the sun and the
              sound of water moving in the courtyard.
            </p>
            <span
              data-experience-copy
              className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.28em] text-ink/35"
            >
              <span className="h-1 w-1 rounded-full bg-ink/40" />
              Viewings by appointment
            </span>
          </div>
        </div>

        <div ref={deckRef} className="depth-stage mt-16 md:mt-24">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 md:gap-7">
            {scenes.map((scene) => (
              <figure
                key={scene.no}
                data-deck-card
                className="group relative will-change-transform [transform-style:preserve-3d]"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-ink/[0.04] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.85)] transition-[border-color,box-shadow] duration-500 group-hover:border-ink/30 group-hover:shadow-[0_50px_90px_-35px_rgba(0,0,0,0.9)] sm:aspect-[3/4]">
                  <div data-parallax="7" className="absolute inset-0">
                    <Image
                      src={scene.image}
                      alt={scene.title}
                      fill
                      sizes="(min-width: 640px) 30vw, 92vw"
                      className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />

                  <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 font-mono text-[9px] tracking-[0.2em] text-white/85 backdrop-blur-md md:left-4 md:top-4">
                    {scene.no}
                  </span>

                  <figcaption className="absolute inset-x-0 bottom-0 p-3 md:p-5">
                    <h3 className="font-display text-lg font-normal leading-none text-white md:text-2xl">
                      {scene.title}
                    </h3>
                    <p className="mt-1.5 text-[10px] font-light leading-relaxed text-white/55">
                      {scene.meta}
                    </p>
                    <span
                      aria-hidden="true"
                      className="mt-3 block h-px w-8 bg-white/30 transition-all duration-500 group-hover:w-16 group-hover:bg-white/60 md:mt-4"
                    />
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-px border-t border-line sm:grid-cols-3 md:mt-20">
          {notes.map((note) => (
            <div
              key={note.label}
              className="flex items-baseline justify-between gap-4 border-b border-line py-5 sm:border-b-0 sm:border-r sm:py-7 sm:pr-8 sm:last:border-r-0"
            >
              <span className="font-display text-xl font-normal text-ink/80">{note.label}</span>
              <span className="text-[9px] uppercase tracking-[0.24em] text-ink/35">
                {note.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
