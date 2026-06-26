'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AccountPage from '../../../screens/AccountPage';
export default function Page() {
  return <ProtectedRoute><AccountPage /></ProtectedRoute>;
}
