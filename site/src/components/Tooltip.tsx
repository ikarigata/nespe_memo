import React, { useState, useRef, type ReactNode } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingArrow,
  arrow,
  useClick,
} from '@floating-ui/react';

interface TooltipProps {
  content: ReactNode;
  description: ReactNode;
}

const Tooltip = ({ content, description }: TooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 10 }),
      arrow({
        element: arrowRef,
      }),
    ],
  });

  const click = useClick(context);
  const hover = useHover(context, {
    move: false,
    delay: { open: 0, close: 150 },
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      <span
        ref={refs.setReference}
        {...getReferenceProps()}
        style={{
          cursor: 'help',
          borderBottom: '1px dotted var(--sl-color-accent, #2ca4b0)',
        }}
      >
        {content}
      </span>
      <FloatingPortal>
        {isOpen && (
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              backgroundColor: 'var(--sl-color-black, #222)',
              color: 'var(--sl-color-white, #fff)',
              borderRadius: '4px',
              fontSize: '0.85rem',
              zIndex: 9999,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              width: 'max-content',
              maxWidth: '300px',
              textAlign: 'center',
              lineHeight: '1.4',
              padding: '8px 12px',
            }}
            {...getFloatingProps()}
          >
            {description}
            <FloatingArrow
              ref={arrowRef}
              context={context}
              fill="var(--sl-color-black, #222)"
              height={8}
              width={16}
            />
          </div>
        )}
      </FloatingPortal>
    </>
  );
};

export default Tooltip;
