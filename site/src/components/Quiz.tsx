import React, { useState, type ReactNode } from 'react';

interface QuizProps {
  answer: ReactNode;
  children: ReactNode;
}

const Quiz = ({ answer, children }: QuizProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{
      border: '1px solid var(--sl-color-gray-5, #888)',
      borderRadius: '0.5rem',
      padding: '1rem',
      margin: '1rem 0',
      backgroundColor: 'var(--sl-color-gray-6, rgba(0,0,0,0.05))'
    }}>
      <div style={{ marginBottom: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'flex-start' }}>
        <span style={{ marginRight: '0.5rem', color: 'var(--sl-color-accent-high, #2ca4b0)' }}>Q.</span>
        <div>{children}</div>
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: 'var(--sl-color-accent, #2ca4b0)',
          color: 'var(--sl-color-text-invert, #fff)',
          border: 'none',
          borderRadius: '0.25rem',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 'bold'
        }}
      >
        {isOpen ? '答えを隠す' : '答えを見る'}
      </button>
      {isOpen && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: 'var(--sl-color-gray-5, rgba(0,0,0,0.1))',
          borderRadius: '0.25rem',
          borderLeft: '4px solid var(--sl-color-accent, #2ca4b0)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Answer:</div>
          <div>{answer}</div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
