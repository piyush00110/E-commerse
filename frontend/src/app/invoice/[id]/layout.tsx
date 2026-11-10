import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Invoice',
  robots: { index: false, follow: false },
};

export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
