'use client';

import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';
import './spotlight-card.css';

export interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** Spotlight wash color (default ShopSmart pink). */
  glowColor?: string;
  /** Spotlight border color on hover. */
  borderGlowColor?: string;
  /** Spotlight diameter in px. */
  spotlightSize?: number;
}

const DEMO_CARDS = [
  { icon: '✨', title: 'Premium Quality', text: 'Curated products from trusted brands, verified before they reach the shelf.' },
  { icon: '🚚', title: 'Fast Delivery', text: 'Express shipping with live tracking — free on orders over $50.' },
  { icon: '🔒', title: 'Secure Shopping', text: '256-bit encrypted checkout and buyer protection on every order.' },
];

/**
 * Spotlight glow card. Drop-in wrapper — merge any card class:
 *   <GlowCard className="trust-item">...</GlowCard>
 * Bare <GlowCard /> renders demo content so the snippet works as-is.
 */
export function GlowCard({
  children,
  glowColor = 'rgba(255, 63, 108, 0.14)',
  borderGlowColor = 'rgba(255, 63, 108, 0.55)',
  spotlightSize = 260,
  className,
  style,
  ...rest
}: GlowCardProps) {
  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div
      className={cn('glow-card', className)}
      style={
        {
          '--glow': glowColor,
          '--glow-border': borderGlowColor,
          '--spot-size': `${spotlightSize}px`,
          ...style,
        } as React.CSSProperties
      }
      onMouseMove={handleMove}
      {...rest}
    >
      {children ?? (
        <div className="glow-card-default">
          <span className="glow-card-default-icon">✨</span>
          <h3 className="glow-card-default-title">Glow Card</h3>
          <p className="glow-card-default-text">
            Hover to see the spotlight follow your cursor across the card.
          </p>
        </div>
      )}
    </div>
  );
}

export function Default() {
  return (
    <div className="glow-demo-row">
      {DEMO_CARDS.map((c) => (
        <GlowCard key={c.title}>
          <div className="glow-card-default">
            <span className="glow-card-default-icon">{c.icon}</span>
            <h3 className="glow-card-default-title">{c.title}</h3>
            <p className="glow-card-default-text">{c.text}</p>
          </div>
        </GlowCard>
      ))}
    </div>
  );
}

export default GlowCard;
