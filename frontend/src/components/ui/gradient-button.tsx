'use client';

import React from 'react';
import './gradient-button.css';

export type GradientButtonVariant =
  | 'default'
  | 'variant'
  | 'outline'
  | 'secondary'
  | 'ghost';

export type GradientButtonSize = 'sm' | 'default' | 'lg' | 'icon';

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. `variant="variant"` is the alternate gradient-border style (kept for Demo compat). */
  variant?: GradientButtonVariant;
  size?: GradientButtonSize;
  /** Stretch to full width */
  fullWidth?: boolean;
  /** Show loading spinner + disable */
  loading?: boolean;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export const GradientButton = React.forwardRef<
  HTMLButtonElement,
  GradientButtonProps
>(function GradientButton(
  {
    variant = 'default',
    size = 'default',
    fullWidth = false,
    loading = false,
    className,
    disabled,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  // Allow legacy `variant="variant"` + friendly aliases
  const normalizedVariant: GradientButtonVariant =
    variant === 'variant' ? 'variant' : variant;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cx(
        'gradient-button',
        `gradient-button--${normalizedVariant}`,
        size !== 'default' && `gradient-button--${size}`,
        fullWidth && 'gradient-button--full',
        className,
      )}
      {...rest}
    >
      {loading && <span className="gb-spinner" aria-hidden="true" />}
      {/* wrapper keeps gradient-text working for `variant` style */}
      <span
        className={normalizedVariant === 'variant' ? 'gb-text' : undefined}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 2 }}
      >
        {children}
      </span>
    </button>
  );
});

export default GradientButton;
