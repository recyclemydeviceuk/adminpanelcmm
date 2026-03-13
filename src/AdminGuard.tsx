import React from 'react';
import { Navigate } from 'react-router-dom';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('adminAuthToken');

  if (!token) {
    return <Navigate to="/admin-cashmymobile/login" replace />;
  }

  return <>{children}</>;
}
