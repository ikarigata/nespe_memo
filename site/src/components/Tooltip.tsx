import React, { useState } from 'react';

const Tooltip = ({ content, description }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      style={{
        position: 'relative',
        cursor: 'help',
        borderBottom: '1px dotted var(--sl-color-accent, #2ca4b0)',
      }}
    >
      {content}
      {isVisible && (
        <span style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          padding: '8px 12px',
          backgroundColor: 'var(--sl-color-black, #222)',
          color: 'var(--sl-color-white, #fff)',
          borderRadius: '4px',
          fontSize: '0.85rem',
          zIndex: 100,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          pointerEvents: 'none',
          width: 'max-content',
          maxWidth: '300px',
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          {description}
          {/* Arrow */}
          <span style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            marginLeft: '-5px',
            borderWidth: '5px',
            borderStyle: 'solid',
            borderColor: 'var(--sl-color-black, #222) transparent transparent transparent'
          }}></span>
        </span>
      )}
    </span>
  );
};

export default Tooltip;
