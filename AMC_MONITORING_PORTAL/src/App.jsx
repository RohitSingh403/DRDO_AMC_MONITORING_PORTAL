import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import Layout from './components/Layout';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Tasks from './pages/Tasks';
import Equipment from './pages/Equipment';
import EquipmentHistory from './pages/EquipmentHistory';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import TaskAssignmentForm from './components/TaskAssignmentForm';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  // Check authentication status
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setUserRole(null);
      setIsInitialized(true);
      return false;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        // Token expired
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUserRole(null);
      } else {
        setIsAuthenticated(true);
        setUserRole(decoded.role);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUserRole(null);
    }
    
    setIsInitialized(true);
  }, []);

  // Check auth on mount and when location changes
  useEffect(() => {
    checkAuth();
  }, [checkAuth, location.pathname]);

  // Handle login
  const handleLogin = useCallback((userData) => {
    localStorage.setItem('token', userData.token);
    setIsAuthenticated(true);
    setUserRole(userData.role);
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUserRole(null);
    return <Navigate to="/login" replace />;
  }, []);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout isAuthenticated={isAuthenticated} userRole={userRole} onLogout={handleLogout}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          isAuthenticated ? (
            <Navigate to={
              userRole === 'admin' ? "/admin-dashboard" : "/user-dashboard"
            } replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        } />
          
          {/* Protected admin routes */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/assign-task" element={
            <ProtectedRoute requiredRole="admin">
              <TaskAssignmentForm />
            </ProtectedRoute>
          } />
          
          <Route path="/tasks" element={
            <ProtectedRoute requiredRole="admin">
              <Tasks />
            </ProtectedRoute>
          } />
          
          {/* Protected user routes */}
          <Route path="/user-dashboard" element={
            <ProtectedRoute requiredRole="personnel">
              <UserDashboard />
            </ProtectedRoute>
          } />
          
          {/* Equipment Management Routes */}
          <Route path="/equipment" element={
            <ProtectedRoute>
              <Equipment />
            </ProtectedRoute>
          } />
          
          <Route path="/equipment/history" element={
            <ProtectedRoute>
              <EquipmentHistory />
            </ProtectedRoute>
          } />
          
          <Route path="/equipment/:id" element={
            <ProtectedRoute>
              <EquipmentHistory />
            </ProtectedRoute>
          } />
          
          {/* Redirect root to appropriate dashboard or login */}
          <Route path="/" element={
            isAuthenticated ? (
              <Navigate to={userRole === 'admin' ? "/admin-dashboard" : "/user-dashboard"} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
  );
}

export default App;
