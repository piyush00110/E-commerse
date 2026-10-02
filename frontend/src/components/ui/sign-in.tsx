'use client';

import React, { useEffect, useState } from 'react';
import { GradientButton } from '@/components/ui/gradient-button';
import { Boxes } from '@/components/ui/background-boxes';
import './sign-in.css';

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

export interface SignInPageProps {
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  onGuestSignIn?: () => void;
  /** Real-auth state (optional — demo can omit) */
  loading?: boolean;
  error?: string;
  hint?: string | null;
  title?: string;
  subtitle?: string;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    avatarSrc: '',
    name: 'Priya Sharma',
    handle: '@priyashops',
    text: 'Checkout takes seconds and my orders always arrive on time. ShopSmart is my default store now.',
  },
];

export function SignInPage({
  heroImageSrc,
  testimonials = DEFAULT_TESTIMONIALS,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  onGuestSignIn,
  loading = false,
  error = '',
  hint = null,
  title = 'Welcome Back',
  subtitle = 'Sign in to continue to ShopSmart',
}: SignInPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [imgOk, setImgOk] = useState(true);

  const items = testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setActiveIdx((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  const active = items[activeIdx % items.length];

  return (
    <div className="signin-shell">
      {/* Left — form */}
      <div className="signin-form-side">
        <div className="signin-form-inner">
          <div className="signin-logo">S</div>
          <h1 className="signin-title">{title}</h1>
          <p className="signin-subtitle">{subtitle}</p>

          {error ? (
            <div className="signin-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7S11.9 1 8 1zm3.5 10.5L10.5 12.5 8 10 5.5 12.5 4.5 11.5 7 9 4.5 6.5 5.5 5.5 8 8l2.5-2.5 1 1L9 9.5l2.5 2z" />
              </svg>
              <span>{error}</span>
            </div>
          ) : null}

          <form onSubmit={onSignIn}>
            <div className="signin-field">
              <label className="signin-label" htmlFor="signin-email">Email Address</label>
              <input
                id="signin-email"
                name="email"
                className="signin-input"
                type="email"
                autoComplete="email"
                maxLength={254}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="signin-field">
              <label className="signin-label" htmlFor="signin-password">Password</label>
              <div className="signin-pass-wrap">
                <input
                  id="signin-password"
                  name="password"
                  className="signin-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  maxLength={128}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="signin-eye"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="signin-row">
              <label className="signin-remember">
                <input type="checkbox" name="remember" defaultChecked />
                Remember me
              </label>
              {onResetPassword ? (
                <button type="button" className="signin-link" onClick={onResetPassword}>
                  Forgot password?
                </button>
              ) : null}
            </div>

            {hint ? <div className="signin-hint">{hint}</div> : null}

            <GradientButton type="submit" size="lg" fullWidth disabled={loading} loading={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </GradientButton>
          </form>

          {onGoogleSignIn ? (
            <>
              <div className="signin-divider"><span>or</span></div>
              <button type="button" className="signin-google" onClick={onGoogleSignIn}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c0 1.1-.7 2.7-2.2 3.8l-.1.1 3.2 2.5.2.1c2-1.9 3.9-4.7 3.9-8.7z" />
                  <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.1.1-3.1 2.4-.1.1C3.9 21.3 7.7 24 12 24z" />
                  <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.1-2.4-.1.1C.7 9.2 0 10.5 0 12s.7 2.8 1.9 4.8l3.3-2.4z" />
                  <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.7 0 3.9 2.7 1.9 7.2l3.3 2.5c1-2.9 3.7-5 6.8-5z" />
                </svg>
                Continue with Google
              </button>
            </>
          ) : null}

          {onGuestSignIn ? (
            <button type="button" className="signin-guest" onClick={onGuestSignIn}>
              Continue as Guest
            </button>
          ) : null}

          {onCreateAccount ? (
            <div className="signin-footer">
              Don&apos;t have an account?{' '}
              <button type="button" className="signin-link" onClick={onCreateAccount}>
                Create Account
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right — hero + testimonials */}
      <div className="signin-hero">
        <Boxes />
        {heroImageSrc && imgOk ? (
          <img
            className="signin-hero-img"
            src={heroImageSrc}
            alt=""
            onError={() => setImgOk(false)}
          />
        ) : null}
        <div className="signin-hero-shapes">
          <div className="signin-hero-shape" style={{ width: 380, height: 380, background: '#ff3f6c', top: '-8%', right: '-6%' }} />
          <div className="signin-hero-shape" style={{ width: 300, height: 300, background: '#ff905a', bottom: '10%', left: '-8%' }} />
        </div>
        <div className="signin-hero-overlay" />

        <div className="signin-hero-brand">
          <span className="signin-hero-brand-mark">S</span>
          ShopSmart
        </div>

        <div className="signin-testimonial" key={activeIdx}>
          <div className="signin-stars">★★★★★</div>
          <p className="signin-quote">&ldquo;{active.text}&rdquo;</p>
          <div className="signin-person">
            {active.avatarSrc ? (
              <img
                className="signin-avatar"
                src={active.avatarSrc}
                alt={active.name}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <span className="signin-avatar-fallback">{active.name.charAt(0)}</span>
            )}
            <div>
              <div className="signin-name">{active.name}</div>
              <div className="signin-handle">{active.handle}</div>
            </div>
          </div>
          {items.length > 1 ? (
            <div className="signin-dots">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Testimonial ${i + 1}`}
                  className={`signin-dot${i === activeIdx % items.length ? ' active' : ''}`}
                  onClick={() => setActiveIdx(i)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default SignInPage;
