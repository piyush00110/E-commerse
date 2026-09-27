'use client';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import SellerOrders from '../../../../screens/SellerOrders';
export default function Page() {
  return <ProtectedRoute><SellerOrders /></ProtectedRoute>;
}
