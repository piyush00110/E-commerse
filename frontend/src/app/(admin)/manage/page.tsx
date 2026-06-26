'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ManagePage from '../../../screens/ManagePage';
export default function Page() {
  return <ProtectedRoute adminOnly><ManagePage /></ProtectedRoute>;
}
