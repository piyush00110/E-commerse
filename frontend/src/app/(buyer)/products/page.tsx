'use client';
import { Suspense } from 'react';
import ProductListPage from '../../../screens/ProductListPage';

function ProductsContent() {
  return <ProductListPage />;
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading products...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
