'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '../services/api';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);
  const [errorShake, setErrorShake] = useState(false);
  const brandingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (brandingRef.current) {
        const scrollY = window.scrollY;
        setParallaxY(scrollY * 0.3);
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authAPI.login({ email, password });
      localStorage.setItem('user', JSON.stringify(res.data.data));
      router.push(redirect);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed';
      setError(msg);
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
          border-color: #6366f1;
          color: #6366f1;
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
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
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
        background: '#f8fafc',
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
                color: '#0f172a',
                marginBottom: '8px',
              }}>
                Welcome Back
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                Sign in to continue to ShopSmart
              </p>
            </div>

            {error && (
              <div
                className={errorShake ? 'shake-error' : ''}
                style={{
                  padding: '12px 16px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#dc2626',
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
                      color: emailFocused ? '#6366f1' : '#374151',
                      marginBottom: '6px',
                      position: emailFocused || email ? 'absolute' : 'relative',
                      top: emailFocused || email ? '-2px' : '0',
                      left: '16px',
                      zIndex: emailFocused || email ? 1 : 0,
                      background: emailFocused || email ? '#f8fafc' : 'transparent',
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder={emailFocused ? 'you@example.com' : ''}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `1px solid ${emailFocused ? '#6366f1' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#ffffff',
                      color: '#0f172a',
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
                      color: passwordFocused ? '#6366f1' : '#374151',
                      marginBottom: '6px',
                      position: passwordFocused || password ? 'absolute' : 'relative',
                      top: passwordFocused || password ? '-2px' : '0',
                      left: '16px',
                      zIndex: passwordFocused || password ? 1 : 0,
                      background: passwordFocused || password ? '#f8fafc' : 'transparent',
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder={passwordFocused ? 'Enter your password' : ''}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 48px 12px 16px',
                        border: `1px solid ${passwordFocused ? '#6366f1' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: '#ffffff',
                        color: '#0f172a',
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
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#6366f1'; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#94a3b8'; }}
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

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
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
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            <button
              type="button"
              className="btn btn-ghost guest-btn"
              onClick={() => router.push('/')}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                color: '#64748b',
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
              color: '#64748b',
            }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" style={{
                color: '#6366f1',
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
