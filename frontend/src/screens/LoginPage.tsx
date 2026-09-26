'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '../services/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

function safeRedirect(raw: string | null): string {
  if (!raw) return '/';
  // Only allow same-origin relative paths (blocks open-redirect attacks).
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('://')) return '/';
  if (raw.startsWith('/manage') || raw.startsWith('/shipping') || raw.startsWith('/delivery')) return '/';
  return raw.slice(0, 200);
}

function lockoutKey(email: string): string {
  return `loginLockout:${email.trim().toLowerCase()}`;
}

function readLockout(email: string): { attempts: number; lockedUntil: number } {
  try {
    if (typeof window === 'undefined') return { attempts: 0, lockedUntil: 0 };
    const raw = localStorage.getItem(lockoutKey(email));
    if (!raw) return { attempts: 0, lockedUntil: 0 };
    const parsed = JSON.parse(raw) as { attempts?: number; lockedUntil?: number };
    return { attempts: Number(parsed.attempts) || 0, lockedUntil: Number(parsed.lockedUntil) || 0 };
  } catch {
    return { attempts: 0, lockedUntil: 0 };
  }
}

function writeLockout(email: string, attempts: number, lockedUntil: number) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(lockoutKey(email), JSON.stringify({ attempts, lockedUntil }));
  } catch { /* ignore */ }
}

const LoginPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get('redirect'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);
  const [errorShake, setErrorShake] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockedSeconds, setLockedSeconds] = useState(0);
  const brandingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Branding panel is hidden on phones — skip the listener there entirely
    // so scrolling never re-renders the form on mobile.
    if (typeof window === 'undefined' || window.innerWidth < 769) return;
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        if (brandingRef.current) setParallaxY(window.scrollY * 0.3);
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (error) {
      setErrorShake(true);
      const timer = setTimeout(() => setErrorShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (lockedSeconds <= 0) return;
    const timer = setTimeout(() => setLockedSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [lockedSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAttemptsLeft(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const lock = readLockout(cleanEmail);
    if (lock.lockedUntil > Date.now()) {
      const secs = Math.ceil((lock.lockedUntil - Date.now()) / 1000);
      setLockedSeconds(secs);
      setError(`Too many failed attempts. Try again in ${secs} seconds.`);
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login({ email: cleanEmail, password });
      writeLockout(cleanEmail, 0, 0);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(res.data.data));
        }
      } catch { /* ignore */ }
      router.push(redirect);
    } catch (err: unknown) {
      const attempts = lock.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        writeLockout(cleanEmail, 0, Date.now() + LOCKOUT_MS);
        setLockedSeconds(Math.ceil(LOCKOUT_MS / 1000));
        setError('Too many failed attempts. Account locked for 60 seconds.');
      } else {
        writeLockout(cleanEmail, attempts, 0);
        const left = MAX_ATTEMPTS - attempts;
        setAttemptsLeft(left);
        // Generic message — never reveal whether the email exists.
        setError(`Invalid email or password. ${left} ${left === 1 ? 'attempt' : 'attempts'} remaining.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Inter', sans-serif",
    }}>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideInForm {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .shake-error {
          animation: shake 0.4s ease-in-out;
        }
        .float-label {
          animation: floatUp 0.25s ease-out forwards;
        }
        .form-animate {
          animation: slideInForm 0.4s ease-out forwards;
        }
        .guest-btn {
          transition: all 0.2s ease;
        }
        .guest-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: #f5f3ff;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
        }
        .guest-btn:active {
          transform: translateY(0);
        }
        .social-btn {
          transition: all 0.2s ease;
        }
        .social-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .social-btn:active {
          transform: scale(0.98);
        }
        @media (max-width: 768px) {
          .branding-panel {
            display: none !important;
          }
        }
      `}</style>

      {/* Left Branding Panel with Parallax */}
      <div
        ref={brandingRef}
        className="branding-panel"
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute',
          top: `-20%`,
          right: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.1)',
          filter: 'blur(60px)',
          transform: `translateY(${parallaxY * 0.2}px)`,
          transition: 'transform 0.1s linear',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'rgba(6, 182, 212, 0.08)',
          filter: 'blur(60px)',
          transform: `translateY(${-parallaxY * 0.15}px)`,
          transition: 'transform 0.1s linear',
        }} />
        <div style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: '380px',
          transform: `translateY(${parallaxY * 0.1}px)`,
          transition: 'transform 0.1s linear',
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary), #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
            fontSize: '32px',
            fontWeight: 800,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
          }}>
            S
          </div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 800,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            marginBottom: '16px',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}>
            ShopSmart
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.6,
            maxWidth: '300px',
          }}>
            Your premium destination for curated products and seamless shopping experiences.
          </p>
          <div style={{
            display: 'flex',
            gap: '32px',
            marginTop: '40px',
            justifyContent: 'center',
          }}>
            {['10K+ Products', 'Free Shipping', '24/7 Support'].map((item) => (
              <div key={item} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#06b6d4' }}>{item.split(' ')[0]}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{item.split(' ').slice(1).join(' ')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        background: 'var(--bg-card)',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div className="card form-animate" style={{
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 800,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: 'var(--text)',
                marginBottom: '8px',
              }}>
                Welcome Back
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Sign in to continue to ShopSmart
              </p>
            </div>

            {error && (
              <div
                className={errorShake ? 'shake-error' : ''}
                style={{
                  padding: '12px 16px',
                  background: 'var(--error-light)',
                  border: '1px solid var(--error-light)',
                  borderRadius: '8px',
                  color: 'var(--error)',
                  fontSize: '13px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  animation: 'fadeIn 0.3s ease-out',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7S11.9 1 8 1zm3.5 10.5L10.5 12.5 8 10 5.5 12.5 4.5 11.5 7 9l-2.5-2.5L5.5 5.5 8 8l2.5-2.5L11.5 7 9 9.5l2.5 2z"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <div style={{ position: 'relative' }}>
                  <label
                    className={`form-label ${emailFocused || email ? 'float-label' : ''}`}
                    style={{
                      display: 'block',
                      fontSize: emailFocused || email ? '11px' : '13px',
                      fontWeight: 600,
                      color: emailFocused ? 'var(--primary)' : '#374151',
                      marginBottom: '6px',
                      position: emailFocused || email ? 'absolute' : 'relative',
                      top: emailFocused || email ? '-2px' : '0',
                      left: '16px',
                      zIndex: emailFocused || email ? 1 : 0,
                      background: emailFocused || email ? 'var(--bg-card)' : 'transparent',
                      padding: emailFocused || email ? '0 4px' : '0',
                      transition: 'all 0.2s ease',
                      transformOrigin: 'left',
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    className="form-input"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder={emailFocused ? 'you@example.com' : ''}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `1px solid ${emailFocused ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'var(--bg-card)',
                      color: 'var(--text)',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      boxSizing: 'border-box',
                      boxShadow: emailFocused ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none',
                    }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <div style={{ position: 'relative' }}>
                  <label
                    className={`form-label ${passwordFocused || password ? 'float-label' : ''}`}
                    style={{
                      display: 'block',
                      fontSize: passwordFocused || password ? '11px' : '13px',
                      fontWeight: 600,
                      color: passwordFocused ? 'var(--primary)' : '#374151',
                      marginBottom: '6px',
                      position: passwordFocused || password ? 'absolute' : 'relative',
                      top: passwordFocused || password ? '-2px' : '0',
                      left: '16px',
                      zIndex: passwordFocused || password ? 1 : 0,
                      background: passwordFocused || password ? 'var(--bg-card)' : 'transparent',
                      padding: passwordFocused || password ? '0 4px' : '0',
                      transition: 'all 0.2s ease',
                      transformOrigin: 'left',
                    }}
                  >
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      maxLength={128}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder={passwordFocused ? 'Enter your password' : ''}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 48px 12px 16px',
                        border: `1px solid ${passwordFocused ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: 'var(--bg-card)',
                        color: 'var(--text)',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        boxSizing: 'border-box',
                        boxShadow: passwordFocused ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--primary)'; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'var(--text-tertiary)'; }}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {(attemptsLeft !== null && attemptsLeft <= 2) || lockedSeconds > 0 ? (
                <div style={{ fontSize: 12, color: 'var(--warning)', marginBottom: 12, textAlign: 'center' }}>
                  {lockedSeconds > 0
                    ? `Locked — retry in ${lockedSeconds}s`
                    : 'Hint: check your email spelling and Caps Lock.'}
                </div>
              ) : null}
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading || lockedSeconds > 0}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: loading ? 'var(--text-tertiary)' : 'linear-gradient(135deg, var(--primary), #4f46e5)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                    (e.target as HTMLElement).style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    (e.target as HTMLElement).style.transform = 'translateY(0)';
                    (e.target as HTMLElement).style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                  }
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '20px 0',
              gap: '12px',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <button
              type="button"
              className="btn btn-ghost guest-btn"
              onClick={() => router.push('/')}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Continue as Guest
            </button>

            <div style={{
              marginTop: '28px',
              textAlign: 'center',
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" style={{
                color: 'var(--primary)',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}>
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
