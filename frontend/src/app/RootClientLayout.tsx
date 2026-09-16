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

export default function RootClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <PageTransition>{children}</PageTransition>
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  );
}
