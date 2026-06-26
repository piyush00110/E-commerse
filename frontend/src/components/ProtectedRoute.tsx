import React from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<Props> = ({ children, adminOnly }) => {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  if (!stored) return <Navigate to="/login" replace />;

  if (adminOnly) {
    const user = JSON.parse(stored);
    if (user.role !== 'admin') return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
