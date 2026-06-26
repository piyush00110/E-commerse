'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ShippingDashboard from '../../../screens/ShippingDashboard';
export default function Page() {
  return <ProtectedRoute adminOnly><ShippingDashboard /></ProtectedRoute>;
}
