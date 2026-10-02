'use client';

import { GradientButton } from '@/components/ui/gradient-button';

function Demo() {
  return (
    <div style={{ display: 'flex', gap: 32 }}>
      <GradientButton>Get Started</GradientButton>
      <GradientButton variant="variant">Get Started</GradientButton>
    </div>
  );
}

export { Demo };
