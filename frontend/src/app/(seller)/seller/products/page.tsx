'use client';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import SellerProducts from '../../../../screens/SellerProducts';
export default function Page() {
  return <ProtectedRoute><SellerProducts /></ProtectedRoute>;
}
