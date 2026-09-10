'use client';
import { useEffect, useRef, useCallback } from 'react';

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  stagger?: number;
}

export function useScrollReveal(options: UseScrollRevealOptions = {}) {
  const { threshold = 0.1, rootMargin = '0px 0px -40px 0px', stagger = 80 } = options;
  const containerRef = useRef<HTMLDivElement>(null);

  const setupObserver = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll('.reveal');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = parseInt(el.dataset.revealDelay || '0', 10);
            setTimeout(() => {
              el.classList.add('visible');
            }, delay);
            observer.unobserve(el);
          }
        });
      },
      { threshold, rootMargin }
    );

    elements.forEach((el, i) => {
      const element = el as HTMLElement;
      if (!element.dataset.revealDelay) {
        element.dataset.revealDelay = String(i * stagger);
      }
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [threshold, rootMargin, stagger]);

  useEffect(() => {
    const cleanup = setupObserver();
    return cleanup;
  }, [setupObserver]);

  return containerRef;
}
