'use client';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import OrderConfirmationPage from '../../../../screens/OrderConfirmationPage';
export default function Page() {
  return <ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>;
}
