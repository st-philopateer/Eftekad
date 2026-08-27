import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const userString = localStorage.getItem('currentUser');
  if (!userString) {
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(userString);
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin' || user.role === 'super_admin') {
    return children;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective home dashboard if they try to access unauthorized pages
    switch (user.role) {
      case 'super_admin':
        return <Navigate to="/super-admin" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'priest':
        return <Navigate to="/priest" replace />;
      case 'family_coordinator':
        return <Navigate to="/family-coordinator" replace />;
      case 'assistant_family_coordinator':
        return <Navigate to="/assistant-family-coordinator" replace />;
      case 'general_coordinator':
        return <Navigate to="/general-coordinator" replace />;
      case 'servant':
        return <Navigate to="/servant" replace />;

      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
}
