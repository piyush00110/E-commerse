'use client';
import React from 'react';
import BuyerNavbar from '../../components/BuyerNavbar';
import Footer from '../../components/Footer';
import BackToTop from '../../components/BackToTop';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BuyerNavbar />
      <main>{children}</main>
      <Footer />
      <BackToTop />
    </>
  );
}
