'use client';

import gsap from 'gsap';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export type OverlayPosition =
  | 'left'
  | 'right'
  | 'bottom-left'
  | 'bottom-right'
  | 'bottom-center';

export type InteriorStop = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  startFrame: number;
  endFrame: number;
  position: OverlayPosition;
};

/** Frame ranges assume the 300-frame sequence in /public/frames. */
export const interiorTimeline: InteriorStop[] = [
  {
    id: 'entrance',
    eyebrow: '01 / 06',
    title: 'Entrance',
    description: 'A quiet threshold of stone, light, and shadow.',
    startFrame: 0,
    endFrame: 49,
    position: 'left',
  },
  {
    id: 'living-room',
    eyebrow: '02 / 06',
    title: 'Living Room',
    description: 'Double-height volumes framed by slender steel.',
    startFrame: 50,
    endFrame: 99,
    position: 'right',
  },
  {
    id: 'kitchen',
    eyebrow: '03 / 06',
    title: 'Kitchen',
    description: 'One monolithic island in honed stone.',
    startFrame: 100,
    endFrame: 149,
    position: 'bottom-left',
  },
  {
    id: 'bedroom',
    eyebrow: '04 / 06',
    title: 'Bedroom',
    description: 'Warm oak, linen, and the hush of the garden.',
    startFrame: 150,
    endFrame: 199,
    position: 'bottom-right',
  },
  {
    id: 'bathroom',
    eyebrow: '05 / 06',
    title: 'Bathroom',
    description: 'Travertine, bronze, and filtered morning light.',
    startFrame: 200,
    endFrame: 249,
    position: 'left',
  },
  {
    id: 'garden',
    eyebrow: '06 / 06',
    title: 'Garden',
    description: 'Terraces dissolving into the landscape.',
    startFrame: 250,
    endFrame: 299,
    position: 'bottom-center',
  },
];

const positionClasses: Record<OverlayPosition, string> = {
  left: 'items-center justify-start pl-8 md:pl-16',
  right: 'items-center justify-end pr-8 md:pr-16',
  'bottom-left': 'items-end justify-start pb-16 pl-8 md:pb-20 md:pl-16',
  'bottom-right': 'items-end justify-end pb-16 pr-8 md:pb-20 md:pr-16',
  'bottom-center': 'items-end justify-center pb-12 md:pb-16',
};

// Cards hinge in from the side of the frame they belong to, so the overlay
// reads as a physical panel floating in the room rather than a flat caption.
const tiltByPosition: Record<OverlayPosition, number> = {
  left: 9,
  right: -9,
  'bottom-left': 7,
  'bottom-right': -7,
  'bottom-center': 0,
};

export type InteriorTimelineHandle = {
  /** Map the scroll-selected frame onto every card's fade timeline. */
  updateFrame: (frame: number) => void;
};

type InteriorTimelineProps = {
  stops?: InteriorStop[];
};

const InteriorTimelineOverlays = forwardRef<InteriorTimelineHandle, InteriorTimelineProps>(
  function InteriorTimelineOverlays({ stops = interiorTimeline }, ref) {
    const cardRefs = useRef(new Map<string, HTMLDivElement>());
    const parallaxRefs = useRef(new Map<string, HTMLDivElement>());
    const timelinesRef = useRef(new Map<string, gsap.core.Timeline>());

    useEffect(() => {
      const timelines = timelinesRef.current;
      stops.forEach((stop) => {
        const element = cardRefs.current.get(stop.id);
        if (!element) return;
        const tilt = tiltByPosition[stop.position];

        // One paused timeline per card: hinges out of depth, holds, then
        // recedes. Duration is normalized to 1 so progress maps straight to
        // the frame range.
        const timeline = gsap
          .timeline({ paused: true })
          .fromTo(
            element,
            {
              autoAlpha: 0,
              y: 34,
              z: -140,
              rotateY: tilt,
              rotateX: 6,
              transformPerspective: 1200,
              filter: 'blur(14px)',
            },
            {
              autoAlpha: 1,
              y: 0,
              z: 0,
              rotateY: 0,
              rotateX: 0,
              transformPerspective: 1200,
              filter: 'blur(0px)',
              duration: 0.12,
              ease: 'power3.out',
            },
            0
          )
          .to(
            element,
            {
              autoAlpha: 0,
              y: -22,
              z: -80,
              rotateY: -tilt * 0.6,
              rotateX: -4,
              transformPerspective: 1200,
              filter: 'blur(12px)',
              duration: 0.12,
              ease: 'power2.in',
            },
            0.88
          );

        timelines.set(stop.id, timeline);
        timeline.progress(0);
      });

      return () => {
        timelines.forEach((timeline) => timeline.kill());
        timelines.clear();
      };
    }, [stops]);

    // Parallax is applied to an inner element so it never fights the card's
    // opacity/blur/translate timeline on the outer element.
    useEffect(() => {
      if (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !window.matchMedia('(pointer: fine)').matches
      ) {
        return;
      }

      type Mover = {
        x: (value: number) => void;
        y: (value: number) => void;
        rotationX: (value: number) => void;
        rotationY: (value: number) => void;
      };

      const parallaxElements = parallaxRefs.current;
      const movers: Mover[] = [];
      stops.forEach((stop) => {
        const element = parallaxElements.get(stop.id);
        if (!element) return;
        movers.push({
          x: gsap.quickTo(element, 'x', { duration: 0.9, ease: 'power3.out' }),
          y: gsap.quickTo(element, 'y', { duration: 0.9, ease: 'power3.out' }),
          rotationX: gsap.quickTo(element, 'rotationX', {
            duration: 1.1,
            ease: 'power3.out',
          }),
          rotationY: gsap.quickTo(element, 'rotationY', {
            duration: 1.1,
            ease: 'power3.out',
          }),
        });
      });

      const onMove = (event: MouseEvent) => {
        const nx = (event.clientX / window.innerWidth - 0.5) * 2;
        const ny = (event.clientY / window.innerHeight - 0.5) * 2;
        movers.forEach((mover) => {
          mover.x(nx * -10);
          mover.y(ny * -10);
          mover.rotationY(nx * 2.5);
          mover.rotationX(ny * -2.5);
        });
      };

      window.addEventListener('mousemove', onMove, { passive: true });

      return () => {
        window.removeEventListener('mousemove', onMove);
        parallaxElements.forEach((element) => gsap.killTweensOf(element));
      };
    }, [stops]);

    useImperativeHandle(
      ref,
      () => ({
        updateFrame(frame: number) {
          stops.forEach((stop) => {
            const span = Math.max(1, stop.endFrame - stop.startFrame);
            const progress = Math.min(
              1,
              Math.max(0, (frame - stop.startFrame) / span)
            );
            timelinesRef.current.get(stop.id)?.progress(progress);
          });
        },
      }),
      [stops]
    );

    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
        {stops.map((stop) => (
          <div
            key={stop.id}
            className={`absolute inset-0 flex ${positionClasses[stop.position]}`}
          >
            <div
              ref={(element) => {
                if (element) cardRefs.current.set(stop.id, element);
                else cardRefs.current.delete(stop.id);
              }}
              className="pointer-events-none w-[min(20rem,78vw)] rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl will-change-[opacity,transform,filter]"
            >
              <div
                ref={(element) => {
                  if (element) parallaxRefs.current.set(stop.id, element);
                  else parallaxRefs.current.delete(stop.id);
                }}
                className="[transform-style:preserve-3d] will-change-transform"
              >
                <div className="flex items-center gap-3">
                  <span className="h-px w-6 bg-white/40" />
                  <span className="text-[9px] font-light uppercase tracking-[0.3em] text-white/50">
                    {stop.eyebrow}
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-light tracking-[0.14em] text-white">
                  {stop.title}
                </h2>
                <p className="mt-2 text-xs font-light leading-relaxed text-white/55">
                  {stop.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

export default InteriorTimelineOverlays;
