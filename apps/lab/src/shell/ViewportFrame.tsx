import { useEffect, useRef, useState } from 'react';
import { VIEWPORTS, type Viewport } from './LabContext.tsx';

export interface ViewportFrameProps { viewport: Viewport; src: string; title: string }

/** An iframe at a real device width (so media queries apply), scaled down to fit its container. */
export function ViewportFrame({ viewport, src, title }: ViewportFrameProps) {
  const { width, height } = VIEWPORTS[viewport];
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setScale(Math.min(1, el.clientWidth / width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);
  const url = `${window.location.pathname}${src}`;
  return (
    <div ref={box} className="w-full" style={{ height: height * scale }}>
      <iframe
        title={title}
        src={url}
        width={width}
        height={height}
        className="origin-top-left rounded-card border border-line bg-bg"
        style={{ transform: `scale(${scale})` }}
      />
    </div>
  );
}
