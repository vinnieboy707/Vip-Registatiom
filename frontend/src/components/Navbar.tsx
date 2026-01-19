import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="nav">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          🚗 DMV Registration
        </Link>
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <ul className="nav-menu">
              <li>
                <Link to="/dashboard" className="nav-link">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/vehicle-lookup" className="nav-link">
                  Vehicle Lookup
                </Link>
              </li>
              <li>
                <Link to="/registration" className="nav-link">
                  Register Vehicle
                </Link>
              </li>
              <li>
                <Link to="/title-transfer" className="nav-link">
                  Title Transfer
                </Link>
              </li>
            </ul>
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary">
                {user?.full_name} ({user?.role})
              </span>
              <button onClick={handleLogout} className="btn btn-sm btn-outline">
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="btn btn-sm btn-outline">
              Login
            </Link>
            <Link to="/register" className="btn btn-sm btn-primary">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
