import React from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';

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

export const MermaidBox = ({ children }) => {
  return (
    <div style={{ border: '1px solid #555', borderRadius: '0.5rem', overflow: 'hidden', height: '500px', position: 'relative' }}>
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        wheel={{ step: 0.1 }}
      >
        <Controls />
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {children}
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default MermaidBox;
