'use client';
import ProtectedRoute from '../../../../../components/ProtectedRoute';
import SellerAddProduct from '../../../../../screens/SellerAddProduct';
export default function Page() {
  return <ProtectedRoute><SellerAddProduct /></ProtectedRoute>;
}
