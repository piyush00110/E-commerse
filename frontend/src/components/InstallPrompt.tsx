'use client';

import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'pwaInstallDismissedAt';
const DISMISS_DAYS = 14;

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari exposes this flag instead of display-mode.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function recentlyDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = Number(localStorage.getItem(DISMISS_KEY));
    if (!Number.isFinite(raw) || raw <= 0) return false;
    return Date.now() - raw < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Bottom-of-screen prompt inviting the visitor to install the PWA.
 * Only renders when the browser fires `beforeinstallprompt`, so iOS/Safari
 * users are never shown a button that cannot work.
 */
export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage unavailable */
    }
  };

  const install = async () => {
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'dismissed') {
        dismiss();
        return;
      }
    } catch {
      /* prompt can only be used once */
    }
    setVisible(false);
    setPromptEvent(null);
  };

  if (!visible || !promptEvent) return null;

  return (
    <div
      role="dialog"
      aria-label="Install ShopSmart app"
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 1050,
        width: 'min(400px, calc(100vw - 24px))',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: 'var(--bg-card, #fff)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 16,
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        🛍️
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #0f172a)' }}>
          Install ShopSmart
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary, #64748b)', marginTop: 2 }}>
          Faster shopping, offline browsing, and order alerts.
        </div>
      </div>

      <button
        type="button"
        onClick={install}
        style={{
          padding: '9px 14px',
          borderRadius: 10,
          border: 'none',
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Install
      </button>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-tertiary, #94a3b8)',
          fontSize: 18,
          lineHeight: 1,
          cursor: 'pointer',
          padding: 2,
        }}
      >
        ×
      </button>
    </div>
  );
}
