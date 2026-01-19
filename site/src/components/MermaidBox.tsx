import React, { useRef, useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

const Controls = () => {
  const { resetTransform } = useControls();
  return (
    <button
      onClick={() => resetTransform()}
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.5)',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        padding: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title="Reset View"
      aria-label="Reset zoom and pan"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#000' }}>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    </button>
  );
};

export const MermaidBox = ({ children }: { children: React.ReactNode }) => {
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [initialScale, setInitialScale] = useState(1);

  useEffect(() => {
    const fitToContainer = () => {
      if (!containerRef.current || !contentRef.current) return;

      const container = containerRef.current;
      const content = contentRef.current.querySelector('pre, svg, .mermaid');

      if (!content) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const contentWidth = content.scrollWidth || content.clientWidth;
      const contentHeight = content.scrollHeight || content.clientHeight;

      if (contentWidth === 0 || contentHeight === 0) return;

      const padding = 40;
      const scaleX = (containerWidth - padding) / contentWidth;
      const scaleY = (containerHeight - padding) / contentHeight;
      const scale = Math.min(scaleX, scaleY, 2);

      if (scale > 0 && scale !== Infinity) {
        setInitialScale(scale);
        if (transformRef.current) {
          transformRef.current.centerView(scale);
        }
      }
    };

    const timer = setTimeout(fitToContainer, 100);
    const observer = new MutationObserver(() => {
      setTimeout(fitToContainer, 50);
    });

    if (contentRef.current) {
      observer.observe(contentRef.current, { childList: true, subtree: true });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ border: '1px solid #555', borderRadius: '0.5rem', overflow: 'hidden', height: '500px', position: 'relative' }}
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={initialScale}
        minScale={0.3}
        maxScale={4}
        wheel={{ step: 0.1 }}
        centerOnInit={true}
      >
        <Controls />
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div ref={contentRef}>
            {children}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default MermaidBox;
