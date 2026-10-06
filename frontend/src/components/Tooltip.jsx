import React, { useState, useRef, useEffect } from 'react';

/**
 * Interactive Tooltip Component
 * Displays a sleek, animated dark-mode description balloon when hovering over any button or control.
 *
 * @param {string} text - Description content explaining the button's action
 * @param {React.ReactNode} children - Button or interactive element to wrap
 * @param {'top'|'bottom'|'left'|'right'} position - Placement of the balloon
 * @param {string} className - Optional custom classes for the balloon box
 * @param {string} wrapperClassName - Classes for the wrapper container (e.g., 'w-full block')
 * @param {number} delay - Hover delay in ms before showing tooltip (default: 120ms)
 * @param {boolean} disabled - Whether tooltip display is temporarily disabled
 */
export default function Tooltip({
  text,
  children,
  position = 'top',
  className = '',
  wrapperClassName = '',
  delay = 120,
  disabled = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  if (!text || disabled) {
    return <>{children}</>;
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Compute position & arrow pointer classes
  let positionClasses = 'bottom-full left-1/2 -translate-x-1/2 mb-2';
  let arrowClasses = 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent';

  if (position === 'bottom') {
    positionClasses = 'top-full left-1/2 -translate-x-1/2 mt-2';
    arrowClasses = 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent';
  } else if (position === 'left') {
    positionClasses = 'right-full top-1/2 -translate-y-1/2 mr-2';
    arrowClasses = 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent';
  } else if (position === 'right') {
    positionClasses = 'left-full top-1/2 -translate-y-1/2 ml-2';
    arrowClasses = 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent';
  }

  return (
    <div
      className={`relative inline-flex items-center ${wrapperClassName}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute ${positionClasses} z-50 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95`}
        >
          <div
            className={`bg-slate-900/95 text-slate-100 text-[11px] font-medium leading-snug px-3 py-1.5 rounded-xl shadow-xl border border-slate-700/80 max-w-xs min-w-[140px] whitespace-normal text-center backdrop-blur-md ${className}`}
          >
            {text}
          </div>
          <div className={`w-0 h-0 border-4 absolute ${arrowClasses}`} />
        </div>
      )}
    </div>
  );
}
