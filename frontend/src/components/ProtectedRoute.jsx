import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute - user:', user, 'loading:', loading, 'roles:', roles); // Debug log

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading...
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to signin'); // Debug log
    return <Navigate to="/signin" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    console.log('ProtectedRoute - User role not allowed, redirecting to signin. User role:', user.role, 'Required roles:', roles); // Debug log
    return <Navigate to="/signin" replace />;
  }

  console.log('ProtectedRoute - Access granted'); // Debug log
  return children;
};

export default ProtectedRoute;
