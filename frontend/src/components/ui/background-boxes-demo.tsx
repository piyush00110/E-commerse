'use client';

import React from 'react';
import { Boxes } from '@/components/ui/background-boxes';
import { cn } from '@/lib/utils';

/**
 * Your pasted code, adapted — same component name + structure,
 * Tailwind classes replaced (this project has no Tailwind).
 */
export function BackgroundBoxesDemo() {
  return (
    <div className={cn('bboxes-demo')}>
      <div className="bboxes-mask" />

      <Boxes />
      <h1 className={cn('bboxes-title')}>Tailwind is Awesome</h1>
      <p className="bboxes-sub">Framer motion is the best animation library ngl</p>
    </div>
  );
}

export default BackgroundBoxesDemo;
