'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const INITIAL_CONCURRENCY = 12;
const BACKGROUND_BATCH_SIZE = 4;
const BACKGROUND_IDLE_TIMEOUT = 1500;
const FADE_DURATION_MS = 600;

type IdleDeadlineLike = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type RequestIdle = (
  callback: (deadline: IdleDeadlineLike) => void,
  options?: { timeout: number }
) => number;
type CancelIdle = (handle: number) => void;
type Scheduler = { request: RequestIdle; cancel: CancelIdle };

function getIdleScheduler(): Scheduler | null {
  if (typeof window === 'undefined') return null;

  const w = window as unknown as {
    requestIdleCallback?: RequestIdle;
    cancelIdleCallback?: CancelIdle;
  };

  if (w.requestIdleCallback && w.cancelIdleCallback) {
    return {
      request: w.requestIdleCallback.bind(w),
      cancel: w.cancelIdleCallback.bind(w),
    };
  }

  // Safari / older browsers: a timeout still keeps the work off the render
  // path, it just isn't tied to genuine browser idle time.
  return {
    request: (callback) =>
      window.setTimeout(
        () => callback({ didTimeout: true, timeRemaining: () => 8 }),
        120
      ),
    cancel: (handle) => window.clearTimeout(handle),
  };
}

const defaultGetFrameSrc = (index: number) =>
  `/frames/frame_${String(index + 1).padStart(4, '0')}.webp`;

const progressToFrame = (progress: number, totalFrames: number) => {
  const clamped = Math.min(1, Math.max(0, progress));
  return Math.min(totalFrames - 1, Math.floor(clamped * (totalFrames - 1)));
};

export type ImageSequenceCanvasHandle = {
  /** Scroll position at which the pinned trigger selects the given frame. */
  getFrameScrollPosition: (frame: number) => number;
};

export type ImageSequenceCanvasProps = {
  /** Total number of frames in the sequence. */
  totalFrames?: number;
  /** How many frames must be ready before the preloader hides. */
  initialFrames?: number;
  /** Map a zero-based frame index to a URL under /public. */
  getFrameSrc?: (index: number) => string;
  /** ScrollTrigger `end` — how much scrolling the pinned section spans. */
  scrollDistance?: string;
  onFrameChange?: (frame: number) => void;
  /** Fires when scroll selects a new frame, even if it isn't cached yet. */
  onFrameSelect?: (frame: number) => void;
  /** Overlays rendered inside the pinned section, above the canvas. */
  children?: ReactNode;
  className?: string;
  id?: string;
  ariaLabel?: string;
};

/**
 * Scroll-scrubbed image sequence.
 *
 * There is no playback clock here. ScrollTrigger's `progress` is the only
 * input that selects a frame: down scrubs forward, up scrubs backward, and
 * stopping leaves the current frame on screen indefinitely. requestAnimationFrame
 * is used solely to paint the one frame that scroll just selected — never to
 * advance the sequence.
 */
const ImageSequenceCanvas = forwardRef<ImageSequenceCanvasHandle, ImageSequenceCanvasProps>(
  function ImageSequenceCanvas(
    {
      totalFrames = 300,
      initialFrames = 150,
      getFrameSrc = defaultGetFrameSrc,
      scrollDistance = '+=300%',
      onFrameChange,
      onFrameSelect,
      children,
      className = '',
      id = 'sequence',
      ariaLabel = 'Scroll-controlled image sequence',
    },
    ref
  ) {
    const sectionRef = useRef<HTMLElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cacheRef = useRef(new Map<number, HTMLImageElement>());
    const inflightRef = useRef(new Map<number, Promise<void>>());
    const renderRafRef = useRef<number | null>(null);
    const requestRenderRef = useRef<(frame: number) => void>(() => {});
    const triggerRef = useRef<ScrollTrigger | null>(null);

    // The frame requested by ScrollTrigger and the frame actually on the canvas.
    const targetFrameRef = useRef(0);
    const drawnFrameRef = useRef(-1);

    const getFrameSrcRef = useRef(getFrameSrc);
    const onFrameChangeRef = useRef(onFrameChange);
    const onFrameSelectRef = useRef(onFrameSelect);

    const initialCount = Math.max(1, Math.min(initialFrames, totalFrames));

    const [loadedCount, setLoadedCount] = useState(0);
    const [ready, setReady] = useState(false);
    const [preloaderMounted, setPreloaderMounted] = useState(true);

    useImperativeHandle(
      ref,
      () => ({
        getFrameScrollPosition(frame: number) {
          const trigger = triggerRef.current;
          if (!trigger) return 0;
          const clamped = Math.max(0, Math.min(totalFrames - 1, frame));
          const frameProgress = totalFrames > 1 ? clamped / (totalFrames - 1) : 0;
          return trigger.start + frameProgress * (trigger.end - trigger.start);
        },
      }),
      [totalFrames]
    );

    useEffect(() => {
      getFrameSrcRef.current = getFrameSrc;
      onFrameChangeRef.current = onFrameChange;
      onFrameSelectRef.current = onFrameSelect;
    }, [getFrameSrc, onFrameChange, onFrameSelect]);

    const loadFrame = useCallback(
      (index: number, priority: 'high' | 'low' = 'high'): Promise<void> => {
        if (index < 0 || index >= totalFrames) return Promise.resolve();

        const cache = cacheRef.current;
        if (cache.has(index)) return Promise.resolve();

        const inflight = inflightRef.current;
        const existing = inflight.get(index);
        if (existing) return existing;

        const image = new Image();
        image.decoding = 'async';
        image.setAttribute('fetchpriority', priority);

        const promise = new Promise<void>((resolve) => {
          image.onload = () => {
            cache.set(index, image);
            inflight.delete(index);

            // If this was the frame scroll already selected, paint it now. The
            // frame number itself does not change — only the pixels catch up.
            if (index === targetFrameRef.current && index !== drawnFrameRef.current) {
              requestRenderRef.current(index);
            }
            resolve();
          };
          image.onerror = () => {
            // Skip a missing frame rather than stalling the sequence.
            inflight.delete(index);
            resolve();
          };
        });

        inflight.set(index, promise);
        image.src = getFrameSrcRef.current(index);
        return promise;
      },
      [totalFrames]
    );

    // Phase 1: the first N frames, with limited concurrency. Only these frames
    // count toward the preloader percentage.
    useEffect(() => {
      let cancelled = false;
      let next = 0;
      let finished = 0;

      const worker = async () => {
        while (!cancelled && next < initialCount) {
          const index = next;
          next += 1;
          await loadFrame(index, 'high');
          finished += 1;
          if (!cancelled) setLoadedCount(finished);
        }
      };

      const workers = Array.from({ length: Math.min(INITIAL_CONCURRENCY, initialCount) }, worker);

      void Promise.all(workers).then(() => {
        if (!cancelled) setReady(true);
      });

      return () => {
        cancelled = true;
      };
    }, [initialCount, loadFrame]);

    // Phase 2: remaining frames, fetched in small batches during browser idle
    // time so they never compete with scrolling.
    useEffect(() => {
      if (!ready) return;

      const scheduler = getIdleScheduler();
      if (!scheduler) return;

      let cancelled = false;
      let index = initialCount;
      let handle: number | null = null;

      const step = (deadline: IdleDeadlineLike) => {
        if (cancelled) return;

        let scheduled = 0;
        while (
          index < totalFrames &&
          scheduled < BACKGROUND_BATCH_SIZE &&
          inflightRef.current.size < 8 &&
          (deadline.didTimeout || deadline.timeRemaining() > 2)
        ) {
          void loadFrame(index, 'low');
          index += 1;
          scheduled += 1;
        }

        if (index < totalFrames) {
          handle = scheduler.request(step, { timeout: BACKGROUND_IDLE_TIMEOUT });
        }
      };

      handle = scheduler.request(step, { timeout: BACKGROUND_IDLE_TIMEOUT });

      return () => {
        cancelled = true;
        if (handle !== null) scheduler.cancel(handle);
      };
    }, [ready, initialCount, totalFrames, loadFrame]);

    // Fade the preloader out (driven by `ready`), then remove it from the tree.
    useEffect(() => {
      if (!ready) return;
      const timer = window.setTimeout(() => setPreloaderMounted(false), FADE_DURATION_MS);
      return () => window.clearTimeout(timer);
    }, [ready]);

    /** Paint exactly one frame. No interpolation, no advancing. */
    const drawFrame = useCallback(
      (frame: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.round(rect.width * dpr));
        const height = Math.max(1, Math.round(rect.height * dpr));

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        const image = cacheRef.current.get(frame);
        if (!image || !image.naturalWidth || !image.naturalHeight) {
          // Not cached yet: request it, but leave the existing pixels untouched.
          // Never substitute a different frame just because it happens to be ready.
          void loadFrame(frame, 'high');
          return;
        }

        const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
        const drawWidth = image.naturalWidth * scale;
        const drawHeight = image.naturalHeight * scale;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(
          image,
          (width - drawWidth) / 2,
          (height - drawHeight) / 2,
          drawWidth,
          drawHeight
        );

        drawnFrameRef.current = frame;
        onFrameChangeRef.current?.(frame);
      },
      [loadFrame]
    );

    /**
     * Schedule a single paint for the latest scroll-selected frame. Multiple
     * ScrollTrigger updates in one tick collapse into one rAF — this is a render
     * callback, not an animation loop; it never schedules itself again.
     */
    const requestRender = useCallback(
      (frame: number) => {
        targetFrameRef.current = frame;
        if (renderRafRef.current !== null) return;
        renderRafRef.current = window.requestAnimationFrame(() => {
          renderRafRef.current = null;
          drawFrame(targetFrameRef.current);
        });
      },
      [drawFrame]
    );

    useEffect(() => {
      requestRenderRef.current = requestRender;
    }, [requestRender]);

    // One pinned ScrollTrigger section. Wheel / touch scroll drives its progress;
    // there is no scrub smoothing, so progress maps directly to scroll position.
    useEffect(() => {
      const section = sectionRef.current;
      if (!section) return;

      gsap.registerPlugin(ScrollTrigger);

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: scrollDistance,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const frame = progressToFrame(self.progress, totalFrames);
          if (frame !== targetFrameRef.current) {
            requestRender(frame);
            onFrameSelectRef.current?.(frame);
          }
        },
      });

      triggerRef.current = trigger;

      // Pick up the correct frame on load / refresh, even if the page is
      // restored at a non-zero scroll position.
      const initialFrame = progressToFrame(trigger.progress, totalFrames);
      targetFrameRef.current = initialFrame;
      requestRender(initialFrame);
      onFrameSelectRef.current?.(initialFrame);

      return () => {
        triggerRef.current = null;
        trigger.kill();
      };
    }, [totalFrames, scrollDistance, requestRender]);

    // Repaint the current frame when the element is resized (canvas backing
    // store changes); still no frame advance.
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const observer = new ResizeObserver(() => requestRenderRef.current(targetFrameRef.current));
      observer.observe(canvas);
      return () => observer.disconnect();
    }, []);

    useEffect(
      () => () => {
        if (renderRafRef.current !== null) {
          window.cancelAnimationFrame(renderRafRef.current);
          // StrictMode re-runs effects: leaving a cancelled handle here makes
          // every later requestRender short-circuit and the canvas never paints.
          renderRafRef.current = null;
        }
      },
      []
    );

    const percentage = Math.round((loadedCount / initialCount) * 100);

    return (
      <section
        ref={sectionRef}
        id={id}
        className={`relative h-svh w-full bg-neutral-950 ${className}`}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={ariaLabel}
          className="block h-full w-full"
        />

        {children}

        {preloaderMounted && (
          <div
            aria-live="polite"
            aria-busy={!ready}
            className={`absolute inset-0 z-30 flex items-center justify-center bg-neutral-950 text-neutral-100 transition-opacity duration-[600ms] ease-out ${
              ready ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
          >
            <div className="flex w-64 flex-col gap-5">
              <div className="flex items-end justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">
                  Loading
                </span>
                <span className="font-mono text-4xl font-light tabular-nums tracking-tight">
                  {percentage}
                  <span className="ml-1 text-lg text-neutral-500">%</span>
                </span>
              </div>

              <div className="h-px w-full overflow-hidden bg-neutral-800">
                <div
                  className="h-full bg-neutral-100 transition-[width] duration-200 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <p className="text-xs text-neutral-500">
                {ready ? 'Ready' : `${loadedCount} / ${initialCount} frames`}
              </p>
            </div>
          </div>
        )}
      </section>
    );
  }
);

export default ImageSequenceCanvas;
