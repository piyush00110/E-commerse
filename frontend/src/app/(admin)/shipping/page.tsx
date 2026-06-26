'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ShippingManagePage from '../../../screens/ShippingManagePage';
export default function Page() {
  return <ProtectedRoute adminOnly><ShippingManagePage /></ProtectedRoute>;
}
