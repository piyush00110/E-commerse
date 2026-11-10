'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';

function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('enter');
  const latestChildren = useRef(children);
  latestChildren.current = children;

  useEffect(() => {
    setTransitionStage('exit');
    const timer = setTimeout(() => {
      setDisplayChildren(latestChildren.current);
      setTransitionStage('enter');
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      style={{
        animation: transitionStage === 'enter'
          ? 'fadeSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both'
          : 'none',
        opacity: transitionStage === 'exit' ? 0 : 1,
        transition: 'opacity 0.15s ease-out',
      }}
    >
      {displayChildren}
    </div>
  );
}

function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Avoid stale cached bundles while developing locally.
    if (process.env.NODE_ENV !== 'production') return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* PWA is progressive enhancement; ignore registration failures. */
      });
    };
    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);
  return null;
}

export default function RootClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ServiceWorkerRegistrar />
      <ToastProvider>
        <ErrorBoundary>
          <PageTransition>{children}</PageTransition>
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  );
}
