'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<Props> = ({ children, adminOnly }) => {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.replace('/login');
      return;
    }
    if (adminOnly) {
      try {
        const user = JSON.parse(stored);
        if (user.role !== 'admin') {
          router.replace('/');
          return;
        }
      } catch {
        router.replace('/login');
        return;
      }
    }
    setAuthorized(true);
    setChecked(true);
  }, [adminOnly, router]);

  if (!checked) return <div className="spinner" />;
  if (!authorized) return null;
  return <>{children}</>;
};

export default ProtectedRoute;
