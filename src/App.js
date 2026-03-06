import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import AdminPanel from './AdminPanel';
import Login from './Login';
import StudentDashboard from './StudentDashboard';
import CameraAttendance from './CameraAttendance';
import './App.css';

// Navigation component for each role
function Navigation({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className="flex justify-between items-center bg-white p-4 shadow-md mb-6 rounded-lg max-w-7xl mx-auto">
      <h1 className="text-xl font-bold text-blue-600">Smart Classroom</h1>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 font-medium">Hello, {user.username} ({user.role})</span>
        
        <div className="space-x-2">
          {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
            <>
              <button 
                onClick={() => navigate('/dashboard')} 
                className={`px-4 py-2 text-sm font-medium rounded transition ${isActive('/dashboard') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Classroom Dashboard
              </button>
              <button 
                onClick={() => navigate('/camera')} 
                className={`px-4 py-2 text-sm font-medium rounded transition ${isActive('/camera') ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                📷 Camera Attendance
              </button>
            </>
          )}

          {user.role === 'ADMIN' && (
            <button 
              onClick={() => navigate('/admin')} 
              className={`px-4 py-2 text-sm font-medium rounded transition ${isActive('/admin') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              College Admin Panel
            </button>
          )}
          
          <button 
            onClick={onLogout} 
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded transition ml-2"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

// Protected Route wrapper
function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate home page based on role
    if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// Main App with Routes
function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (authenticatedUser) => {
    setUser(authenticatedUser);
    localStorage.setItem('user', JSON.stringify(authenticatedUser));
    
    // Navigate to role-specific page
    if (authenticatedUser.role === 'STUDENT') {
      navigate('/student');
    } else if (authenticatedUser.role === 'TEACHER') {
      navigate('/dashboard');
    } else if (authenticatedUser.role === 'ADMIN') {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={
          user ? (
            <Navigate to={user.role === 'STUDENT' ? '/student' : '/dashboard'} replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
            <Navigation user={user} onLogout={handleLogout} />
            <AdminPanel />
          </ProtectedRoute>
        } />
        
        {/* Teacher/Admin Dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute user={user} allowedRoles={['ADMIN', 'TEACHER']}>
            <Navigation user={user} onLogout={handleLogout} />
            <Dashboard userRole={user?.role} user={user} />
          </ProtectedRoute>
        } />
        
        {/* Camera Attendance */}
        <Route path="/camera" element={
          <ProtectedRoute user={user} allowedRoles={['ADMIN', 'TEACHER']}>
            <Navigation user={user} onLogout={handleLogout} />
            <CameraAttendance user={user} />
          </ProtectedRoute>
        } />
        
        {/* Student Dashboard */}
        <Route path="/student" element={
          <ProtectedRoute user={user} allowedRoles={['STUDENT']}>
            <nav className="flex justify-between items-center bg-white p-4 shadow-md mb-6 rounded-lg max-w-7xl mx-auto">
              <h1 className="text-xl font-bold text-blue-600">Smart Classroom - Student Portal</h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 font-medium">Hello, {user?.username}</span>
                <button 
                  onClick={handleLogout} 
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded transition"
                >
                  Logout
                </button>
              </div>
            </nav>
            <StudentDashboard user={user} />
          </ProtectedRoute>
        } />
        
        {/* Root redirect */}
        <Route path="/" element={
          user ? (
            <Navigate to={user.role === 'STUDENT' ? '/student' : '/dashboard'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
        
        {/* 404 - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
