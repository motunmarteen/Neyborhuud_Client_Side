'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, Sparkles } from 'lucide-react';

interface Eli5TooltipProps {
  /** The plain-English, kid-friendly explanation */
  explanation: string;
  /** Optional title for the tooltip (e.g. "What is TrustOS?") */
  title?: string;
  /** Convenient alias for title */
  term?: string;
  /** Visual placement preference */
  align?: 'left' | 'right' | 'center';
  /** Extra trigger class names */
  className?: string;
}

/**
 * Eli5Tooltip — "Explain Like I'm 5"
 * Tap or hover trigger with an accessible, friendly popover.
 * Designed so non-technical users immediately grasp complex features.
 */
export function Eli5Tooltip({
  explanation,
  title,
  term,
  align = 'center',
  className = '',
}: Eli5TooltipProps) {
  const effectiveTitle = title || term;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const alignmentClasses = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
    center: 'left-1/2 -translate-x-1/2 origin-top',
  };

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-label={effectiveTitle ? `Explain: ${effectiveTitle}` : 'Explain this feature'}
        className="group p-1 text-black/40 hover:text-[#008A20] focus:text-[#008A20] transition-colors rounded-full focus:outline-none"
      >
        <HelpCircle
          size={14}
          strokeWidth={2}
          className="transition-transform group-hover:scale-110 group-active:scale-95"
        />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className={`absolute top-full mt-2 z-50 w-64 max-w-[85vw] p-3 rounded-2xl bg-white border border-black/10 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150 ${alignmentClasses[align]}`}
        >
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-black/[0.06] mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="p-0.5 rounded-md bg-[#00D431]/10 text-[#008A20]">
                <Sparkles size={11} strokeWidth={2.2} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#008A20]">
                {effectiveTitle || 'Quick Guide'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-black/40 hover:text-black p-0.5 rounded-full"
              aria-label="Close tooltip"
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
          <p className="text-[12px] leading-relaxed text-[#111814] font-normal selection:bg-[#00D431]/20">
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}
