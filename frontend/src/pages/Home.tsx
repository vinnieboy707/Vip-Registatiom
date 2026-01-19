import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      {/* Hero Section */}
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          DMV Vehicle Registration Platform
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Professional, on-site vehicle registration and title transfer services
        </p>
        {!isAuthenticated ? (
          <div className="flex justify-center gap-4">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Sign In
            </Link>
          </div>
        ) : (
          <Link to="/dashboard" className="btn btn-primary btn-lg">
            Go to Dashboard
          </Link>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-3" style={{ marginTop: '3rem' }}>
        <div className="card">
          <h3>🔍 Vehicle Lookup</h3>
          <p>
            Access comprehensive DMV data including registration status, ownership history,
            and stolen vehicle reports.
          </p>
        </div>

        <div className="card">
          <h3>💰 Fee Calculator</h3>
          <p>
            Calculate registration fees, title transfer costs, and get instant quotes for
            standard, out-of-state, and family transfers.
          </p>
        </div>

        <div className="card">
          <h3>📱 Mobile-First</h3>
          <p>
            File registrations on-site at customer locations with our mobile-optimized
            platform. Work anywhere, anytime.
          </p>
        </div>

        <div className="card">
          <h3>🔒 Secure & Compliant</h3>
          <p>
            Enterprise-grade security with encrypted data, audit logging, and full
            compliance with DMV regulations.
          </p>
        </div>

        <div className="card">
          <h3>📊 Complete Records</h3>
          <p>
            Track all registrations, title transfers, and ownership changes with
            comprehensive historical records.
          </p>
        </div>

        <div className="card">
          <h3>⚡ Fast Processing</h3>
          <p>
            Streamlined workflows and real-time DMV integration for quick turnaround
            times on all services.
          </p>
        </div>
      </div>

      {/* Services */}
      <div className="card" style={{ marginTop: '3rem' }}>
        <h2>Our Services</h2>
        <div className="grid grid-cols-2" style={{ marginTop: '1.5rem' }}>
          <div>
            <h4>✅ Vehicle Registration</h4>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '2' }}>
              <li>New vehicle registration</li>
              <li>Registration renewals</li>
              <li>Registration transfers</li>
              <li>License plate replacement</li>
            </ul>
          </div>

          <div>
            <h4>✅ Title Transfers</h4>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '2' }}>
              <li>Standard title transfers</li>
              <li>Out-of-state transfers</li>
              <li>Family member transfers</li>
              <li>Duplicate titles</li>
            </ul>
          </div>

          <div>
            <h4>✅ Vehicle Information</h4>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '2' }}>
              <li>Owner information</li>
              <li>Ownership history</li>
              <li>Stolen vehicle check</li>
              <li>Title information</li>
            </ul>
          </div>

          <div>
            <h4>✅ On-Site Services</h4>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '2' }}>
              <li>Mobile filing service</li>
              <li>Document verification</li>
              <li>Instant fee calculation</li>
              <li>Real-time status updates</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      {!isAuthenticated && (
        <div className="card" style={{ textAlign: 'center', marginTop: '3rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <h2 style={{ color: 'white' }}>Ready to Get Started?</h2>
          <p style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>
            Join our platform today and streamline your vehicle registration services
          </p>
          <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: '#667eea' }}>
            Create Free Account
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
