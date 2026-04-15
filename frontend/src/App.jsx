import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import PatientSearchEdit from './pages/PatientSearchEdit';
import PreliminaryInvestigation from './pages/PreliminaryInvestigation';
import Reports from './pages/Reports';
import Masters from './pages/Masters';
import PatientReport from './pages/PatientReport';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="text-red-500 font-bold p-6">Access Denied</div>;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route 
             path="/register" 
             element={<Registration />} 
          />
          <Route 
             path="/search" 
             element={<PatientSearchEdit />} 
          />
          <Route 
             path="/investigations" 
             element={<ProtectedRoute allowedRoles={['Admin', 'User2/User3']}><PreliminaryInvestigation /></ProtectedRoute>} 
          />
          <Route 
             path="/reports" 
             element={<Reports />} 
          />
          <Route 
             path="/masters" 
             element={<ProtectedRoute allowedRoles={['Admin']}><Masters /></ProtectedRoute>} 
          />
          <Route 
             path="/patient-report/:id" 
             element={<ProtectedRoute allowedRoles={['Admin', 'User1', 'User2/User3']}><PatientReport /></ProtectedRoute>} 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
