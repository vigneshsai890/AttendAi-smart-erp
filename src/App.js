import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './Dashboard';
import AdminPanel from './AdminPanel';
import Login from './Login';
import StudentDashboard from './StudentDashboard';
import CameraAttendance from './CameraAttendance';
import './App.css';

// Glassmorphism Navigation
function Navigation({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    ...(user.role === 'ADMIN' || user.role === 'TEACHER' ? [
      { path: '/dashboard', label: 'Dashboard', icon: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )},
      { path: '/camera', label: 'Camera AI', icon: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14" />
          <rect x="3" y="8" width="12" height="9" rx="2" />
        </svg>
      )},
    ] : []),
    ...(user.role === 'ADMIN' ? [
      { path: '/admin', label: 'Admin Panel', icon: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )},
    ] : []),
  ];

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-2xl py-2' : 'py-3'
      }`}
      style={{ backdropFilter: 'blur(20px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <span className="font-bold text-white font-display text-sm">Smart Classroom</span>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: isActive(link.path) ? 'white' : 'rgba(148,163,184,0.8)' }}
            >
              {isActive(link.path) && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {link.icon}
                {link.label}
              </span>
            </button>
          ))}

          {/* User Badge */}
          <div className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
            {user.username} · {user.role}
          </div>

          {/* Logout */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLogout}
            className="ml-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            Sign Out
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}

// Protected Route
function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// Page transitions
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  const handleLogin = (authenticatedUser) => {
    setUser(authenticatedUser);
    localStorage.setItem('user', JSON.stringify(authenticatedUser));
    if (authenticatedUser.role === 'STUDENT') navigate('/student');
    else navigate('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={
            user
              ? <Navigate to={user.role === 'STUDENT' ? '/student' : '/dashboard'} replace />
              : <motion.div variants={pageVariants} initial="initial" animate="enter" exit="exit"><Login onLogin={handleLogin} /></motion.div>
          } />
          <Route path="/admin" element={
            <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
              <>
                <Navigation user={user} onLogout={handleLogout} />
                <motion.div className="pt-16" variants={pageVariants} initial="initial" animate="enter" exit="exit">
                  <AdminPanel />
                </motion.div>
              </>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute user={user} allowedRoles={['ADMIN', 'TEACHER']}>
              <>
                <Navigation user={user} onLogout={handleLogout} />
                <motion.div className="pt-16" variants={pageVariants} initial="initial" animate="enter" exit="exit">
                  <Dashboard userRole={user?.role} user={user} />
                </motion.div>
              </>
            </ProtectedRoute>
          } />
          <Route path="/camera" element={
            <ProtectedRoute user={user} allowedRoles={['ADMIN', 'TEACHER']}>
              <>
                <Navigation user={user} onLogout={handleLogout} />
                <motion.div className="pt-16" variants={pageVariants} initial="initial" animate="enter" exit="exit">
                  <CameraAttendance user={user} />
                </motion.div>
              </>
            </ProtectedRoute>
          } />
          <Route path="/student" element={
            <ProtectedRoute user={user} allowedRoles={['STUDENT']}>
              <>
                <motion.nav
                  initial={{ y: -80 }} animate={{ y: 0 }}
                  className="fixed top-0 left-0 right-0 z-50 glass py-3"
                >
                  <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </div>
                      <span className="font-bold text-white text-sm font-display">Student Portal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                        {user?.username}
                      </span>
                      <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </motion.nav>
                <motion.div className="pt-16" variants={pageVariants} initial="initial" animate="enter" exit="exit">
                  <StudentDashboard user={user} />
                </motion.div>
              </>
            </ProtectedRoute>
          } />
          <Route path="/" element={user ? <Navigate to={user.role === 'STUDENT' ? '/student' : '/dashboard'} replace /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
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
