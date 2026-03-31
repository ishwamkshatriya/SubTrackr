import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SignIn from './pages/Auth/SignIn.jsx';
import SignUp from './pages/Auth/SignUp.jsx';
import UserDashboard from './pages/User/Dashboard.jsx';
import Plans from './pages/User/Plans.jsx';
import Subscription from './pages/User/Subscription.jsx';
import Offers from './pages/User/Offers.jsx';
import AdminDashboard from './pages/Admin/Dashboard.jsx';
import ManagePlans from './pages/Admin/ManagePlans.jsx';
import ManageDiscounts from './pages/Admin/ManageDiscounts.jsx';
import AuditLog from './pages/Admin/AuditLog.jsx';
import Notification from './components/Notification.jsx';
import './App.css';

function App() {
  console.log('App component is rendering'); // Debug log
  
  // Simple test to see if React is working
  try {
    return (
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="app-container">
              <Navbar />
              <main className="main-content">
              <Routes>
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route
                  path="/user/dashboard"
                  element={
                    <ProtectedRoute roles={['user']}>
                      <UserDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user/plans"
                  element={
                    <ProtectedRoute roles={['user']}>
                      <Plans />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user/subscription"
                  element={
                    <ProtectedRoute roles={['user']}>
                      <Subscription />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user/offers"
                  element={
                    <ProtectedRoute roles={['user']}>
                      <Offers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/manage-plans"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <ManagePlans />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/manage-discounts"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <ManageDiscounts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit-log"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AuditLog />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/signin" replace />} />
              </Routes>
            </main>
            <Footer />
            <Notification />
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
    );
  } catch (error) {
    console.error('App component error:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>App Error</h1>
        <p>Error: {error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    );
  }
}

export default App;
