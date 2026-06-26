'use client';
import React from 'react';
import SellerNavbar from '../../components/SellerNavbar';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SellerNavbar />
      <main>{children}</main>
    </>
  );
}
