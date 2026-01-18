import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export const MermaidScroll = ({ children }) => {
  return (
    <div style={{ border: '1px solid #555', borderRadius: '0.5rem', overflow: 'hidden', height: '500px' }}>
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        wheel={{ step: 0.1 }}
      >
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {children}
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default MermaidScroll;
