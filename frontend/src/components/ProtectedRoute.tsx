'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { verifyAdminAccess } from '../lib/admin';

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<Props> = ({ children, adminOnly }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window === 'undefined') return;
        const stored = localStorage.getItem('user');
        if (!stored) {
          const redirect = pathname && pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : '';
          router.replace(`/login${redirect}`);
          return;
        }
        if (adminOnly) {
          // Single-admin panel: verified against DB role + email allowlist.
          const result = await verifyAdminAccess();
          if (cancelled) return;
          if (!result.ok) {
            router.replace(result.reason === 'not-logged-in' ? '/login' : '/');
            return;
          }
        }
        if (!cancelled) {
          setAuthorized(true);
          setChecked(true);
        }
      } catch {
        if (!cancelled) router.replace('/login');
      }
    })();
    return () => { cancelled = true; };
  }, [adminOnly, router, pathname]);

  if (!checked) return <div className="spinner" />;
  if (!authorized) return null;
  return <>{children}</>;
};

export default ProtectedRoute;
