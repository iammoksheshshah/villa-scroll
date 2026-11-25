'use client';

import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

const words = ['The', 'detail', 'is', 'the', 'house.'];

const fragments = [
  { image: '/images/detail-threshold.jpg', label: 'Threshold', note: 'A single step of stone' },
  { image: '/images/suite-bedroom.jpg', label: 'Linen', note: 'Washed Belgian linen' },
  { image: '/images/pool-dusk.jpg', label: 'Water', note: 'Still, and slightly warm' },
  { image: '/images/detail-light.jpg', label: 'Reveal', note: 'Shadow held in a joint' },
];

/**
 * A sticky, full-bleed detail study. The photograph pushes in while the
 * headline resolves one word at a time across the scroll, then a strip of
 * fragments settles beneath it.
 */
export default function DetailImmersive() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const context = gsap.context(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const frame = stage.querySelector('[data-frame]');
      const rule = stage.querySelector('[data-rule]');
      const words_ = gsap.utils.toArray<HTMLElement>('[data-word]', stage);
      const meta = gsap.utils.toArray<HTMLElement>('[data-meta]', stage);

      gsap
        .timeline({
          scrollTrigger: {
            trigger: stage,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.7,
          },
          defaults: { ease: 'none' },
        })
        .fromTo(
          frame,
          { scale: 1.32, yPercent: -4 },
          { scale: 1, yPercent: 4, duration: 1 },
          0
        )
        .fromTo(
          words_,
          { opacity: 0.1, yPercent: 60, filter: 'blur(8px)' },
          {
            opacity: 1,
            yPercent: 0,
            filter: 'blur(0px)',
            stagger: 0.32,
            duration: 0.6,
            ease: 'power2.out',
          },
          0.08
        )
        .fromTo(rule, { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0)
        .fromTo(
          meta,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, stagger: 0.18, duration: 0.5 },
          0.35
        );
    }, section);

    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 400);

    return () => {
      window.clearTimeout(refresh);
      context.revert();
    };
  }, []);

  return (
    <section
      id="details"
      ref={sectionRef}
      className="relative border-t border-line bg-base"
    >
      <div ref={stageRef} className="relative h-[230vh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <div className="absolute inset-0">
            <div data-frame className="absolute inset-0 will-change-transform">
              <Image
                src="/images/detail-stair.jpg"
                alt="Sculptural stone staircase in afternoon light"
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/65" />
            <div className="film-grain pointer-events-none absolute inset-0" />
          </div>

          <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-5 sm:px-8 md:px-16">
            <div data-meta className="flex items-center gap-4">
              <span className="font-mono text-[10px] tracking-[0.24em] text-white/50">04</span>
              <span className="h-px w-8 bg-white/35" />
              <span className="text-[10px] font-light uppercase tracking-[0.34em] text-white/65">
                Details
              </span>
            </div>

            <h2 className="mt-8 max-w-4xl font-display text-[clamp(2.5rem,7.6vw,6.5rem)] font-light leading-[0.98] tracking-[-0.015em] text-white">
              {words.map((word, index) => (
                <span
                  key={word}
                  data-word
                  className={`mr-[0.22em] inline-block ${
                    index === words.length - 1 ? 'italic text-white/60' : ''
                  }`}
                >
                  {word}
                </span>
              ))}
            </h2>

            <p
              data-meta
              className="mt-8 max-w-sm text-xs font-light leading-relaxed text-white/55"
            >
              A house is remembered for a dozen small things. The weight of a door. The
              brush of stone underfoot. We draw them first.
            </p>

            <div
              data-meta
              className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-white/15 pt-6"
            >
              {['Honed travertine', 'Patinated bronze', 'Smoked oak'].map((material) => (
                <span
                  key={material}
                  className="text-[9px] uppercase tracking-[0.26em] text-white/45"
                >
                  {material}
                </span>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-5 bottom-8 flex items-end justify-between gap-6 md:inset-x-16 md:bottom-12">
            <span
              data-meta
              className="font-display text-4xl font-light leading-none text-white/25 md:text-6xl"
            >
              04
            </span>
            <div
              data-meta
              className="flex flex-col items-end gap-3 text-right text-[9px] uppercase tracking-[0.24em] text-white/40"
            >
              <span>Detail study</span>
              <span className="hidden sm:inline">Scroll</span>
            </div>
          </div>

          <div className="pointer-events-none absolute right-5 top-1/2 hidden h-40 -translate-y-1/2 md:block md:right-12">
            <div data-rule className="h-full w-px origin-top bg-white/50" />
          </div>
        </div>
      </div>

      <div className="ambient-glow relative z-10 border-t border-line bg-base px-5 py-24 sm:px-8 md:px-16 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h3 className="max-w-md font-display text-[clamp(1.8rem,3.4vw,2.75rem)] font-light leading-[1.02] text-ink">
              Four fragments, held in the <span className="italic text-ink/55">same hand.</span>
            </h3>
            <p className="max-w-[16rem] text-xs font-light leading-relaxed text-ink/45 md:text-right">
              Every surface was chosen on site, in the light it would live in.
            </p>
          </div>

          <div className="depth-stage mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:mt-16 md:grid-cols-4 md:gap-5">
            {fragments.map((fragment, index) => (
              <figure
                key={fragment.label}
                data-animate="depth"
                data-delay={index * 0.06}
                className="group"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-line">
                  <div data-parallax="5" className="absolute inset-0">
                    <Image
                      src={fragment.image}
                      alt={fragment.label}
                      fill
                      sizes="(min-width: 768px) 23vw, 45vw"
                      className="object-cover grayscale transition-all duration-700 ease-out group-hover:scale-[1.04] group-hover:grayscale-0"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-70" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-4">
                    <span className="text-[9px] uppercase tracking-[0.24em] text-white/55">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className="mt-1 font-display text-lg leading-none text-white">
                      {fragment.label}
                    </p>
                  </figcaption>
                </div>
                <p className="mt-3 text-[10px] font-light tracking-wide text-ink/40">
                  {fragment.note}
                </p>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
