import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';
import OnboardingTour, { OnboardingStep } from '../components/OnboardingTour';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { isOnboardingComplete, shouldShowOnboarding, startOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();
  const [showTour, setShowTour] = useState(false);

  // Define onboarding steps
  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: '👋 Welcome to DMV Registration Platform!',
      description: 'This AI-powered onboarding will guide you through the platform\'s key features. Let\'s get started with a quick tour to help you use the app efficiently.',
      position: 'center',
    },
    {
      id: 'dashboard',
      title: '🏠 Your Dashboard',
      description: 'This is your central hub. Here you can see quick actions, statistics, and recent activity. Everything you need is just a click away.',
      position: 'center',
    },
    {
      id: 'vehicle-lookup',
      title: '🔍 Vehicle Lookup',
      description: 'Search for any vehicle by VIN or license plate. Get instant access to real DMV data including registration status, ownership history, and recall information.',
      targetSelector: '[data-onboarding="vehicle-lookup"]',
      position: 'bottom',
    },
    {
      id: 'registration',
      title: '📝 Vehicle Registration',
      description: 'File new registrations or renew existing ones. The system calculates fees automatically and processes everything in under 5 minutes.',
      targetSelector: '[data-onboarding="registration"]',
      position: 'bottom',
    },
    {
      id: 'title-transfer',
      title: '🔄 Title Transfer',
      description: 'Handle title transfers including standard, out-of-state, and family transfers. All paperwork is processed securely with full audit trails.',
      targetSelector: '[data-onboarding="title-transfer"]',
      position: 'bottom',
    },
    {
      id: 'features',
      title: '✨ Platform Features',
      description: 'The platform includes real-time DMV data, stolen vehicle verification, mobile optimization, and comprehensive reporting. Everything is secured with enterprise-grade encryption.',
      position: 'center',
    },
    {
      id: 'complete',
      title: '🎉 You\'re All Set!',
      description: 'You now know how to navigate the platform! Start by looking up a vehicle or filing a new registration. Need help? You can restart this tour anytime from the Help menu.',
      position: 'center',
    },
  ];

  useEffect(() => {
    // Show onboarding on first login
    if (!isOnboardingComplete && shouldShowOnboarding) {
      setShowTour(true);
    }
  }, [isOnboardingComplete, shouldShowOnboarding]);

  // Trigger onboarding automatically on first dashboard visit
  useEffect(() => {
    if (!isOnboardingComplete) {
      const timer = setTimeout(() => {
        startOnboarding();
        setShowTour(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOnboardingComplete, startOnboarding]);

  const handleCompleteTour = () => {
    setShowTour(false);
    completeOnboarding();
  };

  const handleSkipTour = () => {
    setShowTour(false);
    skipOnboarding();
  };

  const handleRestartTour = () => {
    setShowTour(true);
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Welcome back, {user?.full_name}!</h1>
            <p className="text-secondary">
              Role: <span className="badge badge-info">{user?.role}</span>
            </p>
          </div>
          {isOnboardingComplete && (
            <button className="btn btn-outline btn-sm" onClick={handleRestartTour}>
              📚 Restart Tour
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <h2 style={{ marginBottom: '1rem' }}>Quick Actions</h2>
      <div className="grid grid-cols-3">
        <Link 
          to="/vehicle-lookup" 
          className="card" 
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          data-onboarding="vehicle-lookup"
        >
          <h3>🔍 Vehicle Lookup</h3>
          <p>Search for vehicle information by VIN or license plate</p>
        </Link>

        <Link 
          to="/registration" 
          className="card" 
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          data-onboarding="registration"
        >
          <h3>📝 Register Vehicle</h3>
          <p>File new registration or renew existing registration</p>
        </Link>

        <Link 
          to="/title-transfer" 
          className="card" 
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          data-onboarding="title-transfer"
        >
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

      {/* Onboarding Tour */}
      {showTour && (
        <OnboardingTour
          steps={onboardingSteps}
          onComplete={handleCompleteTour}
          onSkip={handleSkipTour}
        />
      )}
    </div>
  );
};

export default Dashboard;
