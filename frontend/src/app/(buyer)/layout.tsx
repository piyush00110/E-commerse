'use client';
import React from 'react';
import BuyerNavbar from '../../components/BuyerNavbar';
import Footer from '../../components/Footer';
import BackToTop from '../../components/BackToTop';
import CompareBar from '../../components/CompareBar';
import InstallPrompt from '../../components/InstallPrompt';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BuyerNavbar />
      <main>{children}</main>
      <Footer />
      <CompareBar />
      <InstallPrompt />
      <BackToTop />
    </>
  );
}
