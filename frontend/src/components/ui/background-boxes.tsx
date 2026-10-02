'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import './background-boxes.css';

/**
 * Aceternity-style Background Boxes — zero-dependency version.
 * No Tailwind, no Framer Motion. Hover glow is pure CSS.
 * Drop-in replacement: `import { Boxes } from "@/components/ui/background-boxes"`
 */

// ShopSmart hover palette (bg + glow pairs)
const HOVER_PAIRS: Array<{ bg: string; glow: string }> = [
  { bg: 'rgba(255,63,108,0.55)', glow: 'rgba(255,63,108,0.45)' }, // primary pink
  { bg: 'rgba(255,144,90,0.55)', glow: 'rgba(255,144,90,0.45)' }, // warm orange
  { bg: 'rgba(20,149,143,0.55)', glow: 'rgba(20,149,143,0.45)' }, // teal
  { bg: 'rgba(255,196,143,0.5)', glow: 'rgba(255,196,143,0.4)' }, // peach
  { bg: 'rgba(127,214,209,0.5)', glow: 'rgba(127,214,209,0.4)' }, // aqua
  { bg: 'rgba(255,255,255,0.35)', glow: 'rgba(255,255,255,0.25)' }, // white
];

function pairFor(i: number, j: number) {
  // deterministic pseudo-random so SSR + client match (no hydration flicker)
  const idx = (i * 31 + j * 17 + ((i * j) % 7)) % HOVER_PAIRS.length;
  return HOVER_PAIRS[idx];
}

export const BoxesCore = ({ className }: { className?: string }) => {
  // Keep grid modest for perf (original 150x100 = 15k nodes is heavy).
  // 28 rows x 22 cols ≈ 616 cells looks identical once skewed/scaled.
  const rows = useMemo(() => new Array(28).fill(1), []);
  const cols = useMemo(() => new Array(22).fill(1), []);

  return (
    <div className={cn('boxes-root', className)} aria-hidden="true">
      {rows.map((_, i) => (
        <div key={`row-${i}`} className="boxes-row">
          {cols.map((_, j) => {
            const pair = pairFor(i, j);
            return (
              <div
                key={`col-${j}`}
                className="boxes-cell"
                style={
                  {
                    '--box-hover': pair.bg,
                    '--box-glow': pair.glow,
                  } as React.CSSProperties
                }
              >
                {j % 2 === 0 && i % 2 === 0 ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="boxes-plus"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v12m6-6H6"
                    />
                  </svg>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const Boxes = React.memo(BoxesCore);
export default Boxes;
