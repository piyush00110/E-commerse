'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import BuyPage from '../../../screens/BuyPage';
export default function Page() {
  return <ProtectedRoute><BuyPage /></ProtectedRoute>;
}
