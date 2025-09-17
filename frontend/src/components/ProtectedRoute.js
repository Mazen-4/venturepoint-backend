import React from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI } from '../utils/authUtils';

export default function ProtectedRoute({ children }) {
  if (!authAPI.hasRole('admin') && !authAPI.hasRole('superadmin')) {
    // Redirect to login if not authenticated
    return <Navigate to="/admin/login" replace />;
    }

  // Render the protected component if authenticated
    return children;
}