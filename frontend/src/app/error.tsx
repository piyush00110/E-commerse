'use client';

import { useEffect } from 'react';
import { GradientButton } from '@/components/ui/gradient-button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Something went wrong</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 24 }}>
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <GradientButton onClick={reset}>
          Try Again
        </GradientButton>
        <GradientButton variant="secondary" onClick={() => { window.location.href = '/'; }}>
          Back to Home
        </GradientButton>
      </div>
    </div>
  );
}
