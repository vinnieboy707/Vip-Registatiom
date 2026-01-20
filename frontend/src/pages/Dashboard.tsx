import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="card">
        <h1>Welcome back, {user?.full_name}!</h1>
        <p className="text-secondary">
          Role: <span className="badge badge-info">{user?.role}</span>
        </p>
      </div>

      {/* Quick Actions */}
      <h2 style={{ marginBottom: '1rem' }}>Quick Actions</h2>
      <div className="grid grid-cols-3">
        <Link to="/vehicle-lookup" className="card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <h3>🔍 Vehicle Lookup</h3>
          <p>Search for vehicle information by VIN or license plate</p>
        </Link>

        <Link to="/registration" className="card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <h3>📝 Register Vehicle</h3>
          <p>File new registration or renew existing registration</p>
        </Link>

        <Link to="/title-transfer" className="card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <h3>🔄 Title Transfer</h3>
          <p>Process title transfers including family and out-of-state</p>
        </Link>
      </div>

      {/* Statistics */}
      <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Overview</h2>
      <div className="grid grid-cols-3">
        <div className="card">
          <h4 className="text-secondary">Services Available</h4>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
            All
          </p>
          <p className="text-sm text-secondary">Full access to all features</p>
        </div>

        <div className="card">
          <h4 className="text-secondary">Processing Time</h4>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--secondary-color)' }}>
            &lt; 5 min
          </p>
          <p className="text-sm text-secondary">Average service completion</p>
        </div>

        <div className="card">
          <h4 className="text-secondary">Support Available</h4>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning-color)' }}>
            24/7
          </p>
          <p className="text-sm text-secondary">Round-the-clock assistance</p>
        </div>
      </div>

      {/* Features */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>Platform Features</h3>
        <div className="grid grid-cols-2" style={{ marginTop: '1rem' }}>
          <div>
            <h4>✅ Vehicle Services</h4>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '2', color: 'var(--text-secondary)' }}>
              <li>Real-time DMV data access</li>
              <li>Registration status checking</li>
              <li>Fee calculation & quotes</li>
              <li>Ownership history lookup</li>
              <li>Stolen vehicle verification</li>
            </ul>
          </div>

          <div>
            <h4>✅ Professional Tools</h4>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '2', color: 'var(--text-secondary)' }}>
              <li>Mobile-optimized interface</li>
              <li>On-site filing capability</li>
              <li>Secure document handling</li>
              <li>Audit trail & logging</li>
              <li>Comprehensive reporting</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <h3>Recent Activity</h3>
        </div>
        <p className="text-center text-secondary" style={{ padding: '2rem' }}>
          No recent activity to display
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
