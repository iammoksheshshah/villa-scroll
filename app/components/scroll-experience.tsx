'use client';

import { useCallback, useRef, useState } from 'react';
import ImageSequenceCanvas, {
  type ImageSequenceCanvasHandle,
} from './image-sequence-canvas';
import InteriorTimelineOverlays, {
  interiorTimeline,
  type InteriorStop,
  type InteriorTimelineHandle,
} from './interior-timeline';
import ProgressNav from './progress-nav';
import { useSmoothScroll } from './smooth-scroll-provider';

const TOTAL_FRAMES = 300;
const INITIAL_FRAMES = 150;

const getFrameSrc = (index: number) =>
  `/frames/frame_${String(index + 1).padStart(4, '0')}.webp`;

const scrollEasing = (t: number) => 1 - Math.pow(1 - t, 4);

export default function ScrollExperience() {
  const canvasRef = useRef<ImageSequenceCanvasHandle>(null);
  const overlaysRef = useRef<InteriorTimelineHandle>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollTo } = useSmoothScroll();

  const handleFrameSelect = useCallback((frame: number) => {
    overlaysRef.current?.updateFrame(frame);

    let index = interiorTimeline.findIndex(
      (stop) => frame >= stop.startFrame && frame <= stop.endFrame
    );
    if (index === -1) {
      index = frame < interiorTimeline[0].startFrame ? 0 : interiorTimeline.length - 1;
    }
    setActiveIndex((current) => (current === index ? current : index));
  }, []);

  const handleSelect = useCallback(
    (stop: InteriorStop) => {
      const target = canvasRef.current?.getFrameScrollPosition(stop.startFrame);
      if (target === undefined) return;

      scrollTo(target, { duration: 1.4, easing: scrollEasing, lock: true });
    },
    [scrollTo]
  );

  return (
    <>
      <ProgressNav
        stops={interiorTimeline}
        activeIndex={activeIndex}
        onSelect={handleSelect}
      />
      <ImageSequenceCanvas
        ref={canvasRef}
        totalFrames={TOTAL_FRAMES}
        initialFrames={INITIAL_FRAMES}
        getFrameSrc={getFrameSrc}
        scrollDistance="+600%"
        onFrameSelect={handleFrameSelect}
      >
        <InteriorTimelineOverlays ref={overlaysRef} />
      </ImageSequenceCanvas>
    </>
  );
}
