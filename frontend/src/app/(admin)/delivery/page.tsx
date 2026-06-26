'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import DeliveryPage from '../../../screens/DeliveryPage';
export default function Page() {
  return <ProtectedRoute adminOnly><DeliveryPage /></ProtectedRoute>;
}
