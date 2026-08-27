import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PriestDashboard from './pages/PriestDashboard';
import ServantDashboard from './pages/ServantDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/priest"
            element={
              <ProtectedRoute allowedRoles={['priest']}>
                <PriestDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/servant"
            element={
              <ProtectedRoute allowedRoles={['servant']}>
                <ServantDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/family-coordinator"
            element={
              <ProtectedRoute allowedRoles={['family_coordinator']}>
                <CoordinatorDashboard isAssistant={false} />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/assistant-family-coordinator"
            element={
              <ProtectedRoute allowedRoles={['assistant_family_coordinator']}>
                <CoordinatorDashboard isAssistant={true} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/general-coordinator"
            element={
              <ProtectedRoute allowedRoles={['general_coordinator']}>
                <CoordinatorDashboard isGeneral={true} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
