'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '../services/api';
import { GradientButton } from '@/components/ui/gradient-button';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
    if (score <= 3) return { score, label: 'Fair', color: '#f59e0b' };
    if (score <= 4) return { score, label: 'Good', color: '#06b6d4' };
    return { score, label: 'Strong', color: 'var(--success)' };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.register({ name: cleanName, email: cleanEmail, password });
      try {
        if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(res.data.data));
      } catch { /* ignore */ }
      router.push('/');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed';
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
      {/* Left Branding Panel */}
      <div style={{
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
      }}>
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.1)',
          filter: 'blur(60px)',
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
        }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '380px' }}>
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
            Join ShopSmart
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.6,
            maxWidth: '300px',
          }}>
            Create an account to unlock exclusive deals, save your preferences, and enjoy a personalized shopping experience.
          </p>
          <div style={{
            display: 'flex',
            gap: '32px',
            marginTop: '40px',
            justifyContent: 'center',
          }}>
            {['Easy Returns', 'Secure Checkout', 'Rewards Points'].map((item) => (
              <div key={item} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#06b6d4' }}>{item.split(' ')[0]}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{item.split(' ').slice(1).join(' ')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Register Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        background: 'var(--bg-card)',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div className="card" style={{
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
                Create Account
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Start your shopping journey today
              </p>
            </div>

            {error && (
              <div style={{
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
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7S11.9 1 8 1zm3.5 10.5L10.5 12.5 8 10 5.5 12.5 4.5 11.5 7 9l-2.5-2.5L5.5 5.5 8 8l2.5-2.5L11.5 7 9 9.5l2.5 2z"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '6px',
                }}>
                  Full Name
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--bg-card)',
                    color: 'var(--text)',
                    transition: 'all 0.2s',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '6px',
                }}>
                  Email Address
                </label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--bg-card)',
                    color: 'var(--text)',
                    transition: 'all 0.2s',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '6px',
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '12px 48px 12px 16px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'var(--bg-card)',
                      color: 'var(--text)',
                      transition: 'all 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box',
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
                    }}
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
                {/* Password Strength Indicator */}
                {password && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      marginBottom: '6px',
                    }}>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          style={{
                            flex: 1,
                            height: '4px',
                            borderRadius: '2px',
                            background: level <= passwordStrength.score ? passwordStrength.color : 'var(--border)',
                            transition: 'all 0.3s',
                          }}
                        />
                      ))}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: passwordStrength.color,
                    }}>
                      {passwordStrength.label}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '28px' }}>
                <label className="form-label" style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '6px',
                }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 48px 12px 16px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'var(--bg-card)',
                      color: 'var(--text)',
                      transition: 'all 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    }}
                  >
                    {showConfirmPassword ? (
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
                {confirmPassword && password !== confirmPassword && (
                  <div style={{
                    marginTop: '6px',
                    fontSize: '12px',
                    color: '#ef4444',
                  }}>
                    Passwords do not match
                  </div>
                )}
              </div>

              <GradientButton
                type="submit"
                size="lg"
                fullWidth
                disabled={loading}
                loading={loading}
                style={{
                  padding: '14px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </GradientButton>
            </form>

            <div style={{
              marginTop: '28px',
              textAlign: 'center',
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}>
              Already have an account?{' '}
              <Link href="/login" style={{
                color: 'var(--primary)',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          div[style*="flex: 1"][style*="background: linear-gradient"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
