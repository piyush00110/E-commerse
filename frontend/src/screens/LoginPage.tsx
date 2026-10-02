'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '../services/api';
import { SignInPage, Testimonial } from '@/components/ui/sign-in';

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

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: 'https://cdn.21st.dev/assets/mirror/9f/9f797e4acee1a4de4f9b4c3aa1cc4e89d7c9efd5dbff1c463d88374ed601d719.jpg',
    name: 'Sarah Chen',
    handle: '@sarahdigital',
    text: 'Amazing platform! The user experience is seamless and the features are exactly what I needed.',
  },
  {
    avatarSrc: 'https://cdn.21st.dev/assets/mirror/8d/8d9a61a581c43fe2088f221b7692c95db4b3ad5c0da0c856400c0e5acdcdcea8.jpg',
    name: 'Marcus Johnson',
    handle: '@marcustech',
    text: 'This service has transformed how I work. Clean design, powerful features, and excellent support.',
  },
  {
    avatarSrc: 'https://cdn.21st.dev/assets/mirror/a6/a634d4f02fe5b77804943c1d74b8d70e35ffe26454e0e9af9717432a2c72bfde.jpg',
    name: 'David Martinez',
    handle: '@davidcreates',
    text: "I've tried many platforms, but this one stands out. Intuitive, reliable, and genuinely helpful for productivity.",
  },
];

const LoginPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get('redirect'));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockedSeconds, setLockedSeconds] = useState(0);

  useEffect(() => {
    if (lockedSeconds <= 0) return;
    const timer = setTimeout(() => setLockedSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [lockedSeconds]);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setAttemptsLeft(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');

    if (!EMAIL_RE.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const lock = readLockout(email);
    if (lock.lockedUntil > Date.now()) {
      const secs = Math.ceil((lock.lockedUntil - Date.now()) / 1000);
      setLockedSeconds(secs);
      setError(`Too many failed attempts. Try again in ${secs} seconds.`);
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      writeLockout(email, 0, 0);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(res.data.data));
        }
      } catch { /* ignore */ }
      router.push(redirect);
    } catch {
      const attempts = lock.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        writeLockout(email, 0, Date.now() + LOCKOUT_MS);
        setLockedSeconds(Math.ceil(LOCKOUT_MS / 1000));
        setError('Too many failed attempts. Account locked for 60 seconds.');
      } else {
        writeLockout(email, attempts, 0);
        const left = MAX_ATTEMPTS - attempts;
        setAttemptsLeft(left);
        // Generic message — never reveal whether the email exists.
        setError(`Invalid email or password. ${left} ${left === 1 ? 'attempt' : 'attempts'} remaining.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError('Google sign-in isn’t connected yet. Please sign in with email.');
  };

  const handleResetPassword = () => {
    setError('Password reset isn’t available yet. Please contact support.');
  };

  const handleCreateAccount = () => {
    router.push(redirect && redirect !== '/' ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register');
  };

  const handleGuestSignIn = () => {
    router.push('/');
  };

  const hint =
    lockedSeconds > 0
      ? `Locked — retry in ${lockedSeconds}s`
      : attemptsLeft !== null && attemptsLeft <= 2
        ? 'Hint: check your email spelling and Caps Lock.'
        : null;

  return (
    <SignInPage
      heroImageSrc="https://cdn.21st.dev/assets/mirror/ec/ecff1664e7fc3185d0e947571f984ea5fa3de9580fb0e73a03cd9c9b3461cb09.jpg"
      testimonials={sampleTestimonials}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
      onGuestSignIn={handleGuestSignIn}
      loading={loading || lockedSeconds > 0}
      error={error}
      hint={hint}
    />
  );
};

export default LoginPage;
