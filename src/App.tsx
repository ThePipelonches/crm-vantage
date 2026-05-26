import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/admin/Dashboard';
import LeadsPage from './pages/leads/Leads';
import PatientsPage from './pages/patients/PatientsPage';
import CommercialDashboard from './pages/commercial/Dashboard';
import PsychologistDashboard from './pages/psychologist/Dashboard';
import ClinicalDashboard from './pages/clinical/Dashboard';
import AppLayout from './layouts/AppLayout';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes with Layout */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            
            {/* Default Redirect */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Admin Routes */}
            <Route path="dashboard" element={
              <RoleProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </RoleProtectedRoute>
            } />
            
            <Route path="leads" element={
              <RoleProtectedRoute allowedRoles={['admin', 'closer']}>
                <LeadsPage />
              </RoleProtectedRoute>
            } />

            <Route path="patients" element={
              <RoleProtectedRoute allowedRoles={['admin', 'psychologist']}>
                <PatientsPage />
              </RoleProtectedRoute>
            } />

            {/* Commercial Routes */}
            <Route path="commercial" element={
              <RoleProtectedRoute allowedRoles={['admin', 'closer']}>
                <CommercialDashboard />
              </RoleProtectedRoute>
            } />

            {/* Psychologist/Clinical Routes */}
            <Route path="clinical" element={
              <RoleProtectedRoute allowedRoles={['admin', 'psychologist']}>
                <ClinicalDashboard />
              </RoleProtectedRoute>
            } />
            
            <Route path="psychologist" element={
              <RoleProtectedRoute allowedRoles={['admin', 'psychologist']}>
                <PsychologistDashboard />
              </RoleProtectedRoute>
            } />

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
            
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;