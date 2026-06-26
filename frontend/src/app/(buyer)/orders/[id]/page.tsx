'use client';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import OrderDetailPage from '../../../../screens/OrderDetailPage';
export default function Page() {
  return <ProtectedRoute><OrderDetailPage /></ProtectedRoute>;
}
