import React from 'react';
import { Navigate } from 'react-router-dom';

function isTokenExpired(token: string): boolean {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    // Unreadable token — treat it as invalid so we fall back to login.
    return true;
  }
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('adminAuthToken');

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('adminAuthToken');
    localStorage.removeItem('adminUser');
    return <Navigate to="/admin-cashmymobile/login" replace />;
  }

  return <>{children}</>;
}
