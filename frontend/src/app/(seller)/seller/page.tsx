'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import SellerDashboard from '../../../screens/SellerDashboard';
export default function Page() {
  return <ProtectedRoute><SellerDashboard /></ProtectedRoute>;
}
