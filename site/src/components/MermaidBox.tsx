import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';

const Controls = () => {
  const { resetTransform } = useControls();
  return (
    <button
      onClick={() => resetTransform()}
      style={{
        position: 'absolute',
        top: '10px',
        right: '50px',
        zIndex: 10,
        background: 'var(--sl-color-bg-nav, rgba(255, 255, 255, 0.8))',
        border: '1px solid var(--sl-color-gray-5, #ccc)',
        borderRadius: '4px',
        cursor: 'pointer',
        padding: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--sl-color-text-accent, #000)',
      }}
      title="Reset View"
      aria-label="Reset zoom and pan"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    </button>
  );
};

export const MermaidBox = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modalContent = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 999999, // Ensure it's on top of everything
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {/* Modal Container */}
      <div style={{
        width: '95vw',
        height: '95vh',
        backgroundColor: 'var(--sl-color-bg, #fff)',
        borderRadius: '8px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 20,
            background: 'var(--sl-color-bg-nav, rgba(255, 255, 255, 0.8))',
            border: '1px solid var(--sl-color-gray-5, #ccc)',
            borderRadius: '4px',
            cursor: 'pointer',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--sl-color-text-accent, #000)',
          }}
          title="Close"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          wheel={{ step: 0.1 }}
          centerOnInit={true}
        >
          <Controls />
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
          >
              {children}
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );

  return (
    <>
      {/* Normal View */}
      <div style={{
        border: '1px solid var(--sl-color-gray-5, #555)',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'var(--sl-color-bg, transparent)',
      }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10,
            background: 'var(--sl-color-bg-nav, rgba(255, 255, 255, 0.7))',
            border: '1px solid var(--sl-color-gray-5, transparent)',
            borderRadius: '4px',
            cursor: 'pointer',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--sl-color-text-accent, #000)',
          }}
          title="Expand View"
          aria-label="Expand view"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
        </button>
        <div style={{ width: '100%', height: 'auto', display: 'flex', justifyContent: 'center' }}>
          {children}
        </div>
      </div>

      {/* Modal View */}
      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
};

export default MermaidBox;
