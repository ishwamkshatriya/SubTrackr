import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import logo from '../assets/logo.svg';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-lg">
      <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
        <img src={logo} alt="Logo" className="h-8 mr-2" />
        <span className="font-bold text-xl">Lumen Subscription Manager</span>
      </Link>
      
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm">Welcome, User</span>
              <span className="bg-blue-500 px-2 py-1 rounded text-xs">
                {user.role}
              </span>
            </div>
            
            {user.role === 'user' && (
              <div className="flex items-center gap-4">
                <Link 
                  to="/user/dashboard" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/user/plans" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition-colors"
                >
                  Plans
                </Link>
                <Link 
                  to="/user/subscription" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition-colors"
                >
                  Subscription
                </Link>
                <Link 
                  to="/user/offers" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition-colors"
                >
                  Offers
                </Link>
              </div>
            )}
            
            {user.role === 'admin' && (
              <div className="flex items-center gap-4">
                <Link 
                  to="/admin/dashboard" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/admin/manage-plans" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition-colors"
                >
                  Manage Plans
                </Link>
                <Link 
                  to="/admin/manage-discounts" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition-colors"
                >
                  Manage Discounts
                </Link>
                <Link 
                  to="/admin/audit-log" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition-colors"
                >
                  Audit Log
                </Link>
              </div>
            )}
            
            <button 
              onClick={handleLogout} 
              className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link 
              to="/signin" 
              className="hover:bg-blue-700 px-3 py-2 rounded transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to="/signup" 
              className="bg-blue-500 hover:bg-blue-700 px-3 py-2 rounded transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
