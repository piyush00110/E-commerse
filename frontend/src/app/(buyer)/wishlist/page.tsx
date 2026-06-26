'use client';
import ProtectedRoute from '../../../components/ProtectedRoute';
import WishlistPage from '../../../screens/WishlistPage';
export default function Page() {
  return <ProtectedRoute><WishlistPage /></ProtectedRoute>;
}
