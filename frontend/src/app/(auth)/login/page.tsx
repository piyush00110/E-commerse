'use client';
import { Suspense } from 'react';
import LoginPage from '../../../screens/LoginPage';
export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}
