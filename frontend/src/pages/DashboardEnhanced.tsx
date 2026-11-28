import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';
import { useNotifications } from '../context/NotificationContext';
import OnboardingTourEnhanced, { OnboardingStep } from '../components/OnboardingTourEnhanced';
import { analyticsService } from '../services/analyticsService';
import { useWebSocket } from '../hooks/useWebSocket';

const DashboardEnhanced: React.FC = () => {
  const { user } = useAuth();
  const { isOnboardingComplete, startOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();
  const { addNotification } = useNotifications();
  const [showTour, setShowTour] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState<any[]>([]);

  // Initialize WebSocket for real-time updates
  useWebSocket({
    notification: (data) => {
      addNotification({
        type: 'info',
        title: 'New Update',
        message: data.message,
      });
    },
    vehicle_update: (data) => {
      setLiveUpdates(prev => [...prev, data]);
    },
  });

  // Enhanced onboarding steps with interactive features
  const enhancedOnboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: '👋 Welcome to DMV Registration Platform!',
      description: 'This AI-powered onboarding will guide you through the platform\'s key features with interactive demos and pro tips!',
      position: 'center',
      achievement: {
        icon: '🎯',
        title: 'Getting Started',
        points: 10,
      },
      tips: [
        'Use keyboard shortcuts (← →) to navigate faster',
        'Complete all steps to earn bonus points',
        'Watch video tutorials for detailed walkthroughs',
      ],
    },
    {
      id: 'dashboard',
      title: '🏠 Your Command Center',
      description: 'This is your central hub with real-time updates, quick actions, and analytics. Everything is optimized for maximum efficiency.',
      position: 'center',
      achievement: {
        icon: '🏆',
        title: 'Dashboard Master',
        points: 15,
      },
      tips: [
        'Monitor real-time updates in the live feed',
        'Track your performance with analytics',
        'Customize your dashboard layout',
      ],
    },
    {
      id: 'vehicle-lookup',
      title: '🔍 Vehicle Lookup',
      description: 'Search for any vehicle by VIN or license plate. Get instant access to real DMV data, ownership history, and recall information from NHTSA.',
      targetSelector: '[data-onboarding="vehicle-lookup"]',
      position: 'bottom',
      achievement: {
        icon: '🚗',
        title: 'Vehicle Inspector',
        points: 20,
      },
      interactiveDemo: {
        type: 'click',
        element: 'vehicle-lookup-card',
        instruction: 'Try clicking on this card to start a vehicle lookup!',
      },
      tips: [
        'Search by VIN for the most accurate results',
        'Use license plate search when VIN is unavailable',
        'Check recall information automatically',
        'View complete ownership history',
      ],
    },
    {
      id: 'registration',
      title: '📝 Vehicle Registration',
      description: 'File new registrations or renew existing ones in under 5 minutes. Automated fee calculation, payment processing, and instant confirmation.',
      targetSelector: '[data-onboarding="registration"]',
      position: 'bottom',
      achievement: {
        icon: '📋',
        title: 'Registration Pro',
        points: 25,
      },
      interactiveDemo: {
        type: 'hover',
        element: 'registration-card',
        instruction: 'Hover over features to see detailed information',
      },
      tips: [
        'Fees are calculated automatically',
        'Multiple payment methods supported',
        'Get instant confirmation',
        'Download receipt immediately',
      ],
    },
    {
      id: 'title-transfer',
      title: '🔄 Title Transfer',
      description: 'Process all types of title transfers: standard, out-of-state, and family transfers. Secure document handling with complete audit trails.',
      targetSelector: '[data-onboarding="title-transfer"]',
      position: 'bottom',
      achievement: {
        icon: '📄',
        title: 'Transfer Expert',
        points: 25,
      },
      tips: [
        'Family transfers have reduced fees',
        'Out-of-state transfers supported',
        'All documents securely encrypted',
        'Track transfer status in real-time',
      ],
    },
    {
      id: 'advanced-features',
      title: '✨ Advanced Platform Features',
      description: 'Real-time notifications, payment processing, analytics tracking, WebSocket live updates, and comprehensive reporting. Everything is secured with enterprise-grade encryption.',
      position: 'center',
      achievement: {
        icon: '🚀',
        title: 'Power User',
        points: 30,
      },
      tips: [
        'Enable real-time notifications for instant updates',
        'Connect payment methods for faster processing',
        'View analytics dashboard for insights',
        'Export reports in multiple formats',
        'Mobile app available for on-the-go access',
      ],
    },
    {
      id: 'complete',
      title: '🎉 You\'re All Set! 125 Points Earned!',
      description: 'Congratulations! You\'ve mastered the DMV Registration Platform. Start processing registrations or transfers now. Need help? Restart this tour anytime from the dashboard.',
      position: 'center',
      achievement: {
        icon: '🏅',
        title: 'Platform Champion',
        points: 50,
      },
      tips: [
        'Bookmark frequently used features',
        'Set up desktop notifications',
        'Explore keyboard shortcuts',
        'Join our community forum',
      ],
    },
  ];

  // Trigger onboarding automatically
  useEffect(() => {
    if (!isOnboardingComplete) {
      const timer = setTimeout(() => {
        startOnboarding();
        setShowTour(true);
        
        // Track onboarding start
        analyticsService.trackOnboardingStep(1, 'welcome', false);
        
        // Welcome notification
        addNotification({
          type: 'info',
          title: 'Welcome! 🎉',
          message: 'Let\'s take a quick tour to get you started!',
          duration: 3000,
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOnboardingComplete, startOnboarding, addNotification]);

  const handleCompleteTour = () => {
    setShowTour(false);
    completeOnboarding();
    
    // Track completion
    analyticsService.trackOnboardingStep(enhancedOnboardingSteps.length, 'complete', true);
    
    // Show completion notification
    addNotification({
      type: 'success',
      title: 'Onboarding Complete! 🎉',
      message: 'You\'ve earned 125 points and unlocked all features!',
      duration: 5000,
    });
  };

  const handleSkipTour = () => {
    setShowTour(false);
    skipOnboarding();
    
    addNotification({
      type: 'info',
      title: 'Tour Skipped',
      message: 'You can restart the tour anytime from the dashboard.',
      duration: 3000,
    });
  };

  const handleRestartTour = () => {
    setShowTour(true);
    analyticsService.trackFeatureUsage('onboarding', 'restart');
    
    addNotification({
      type: 'info',
      title: 'Restarting Tour',
      message: 'Let\'s review the platform features!',
      duration: 2000,
    });
  };

  const handleStepChange = (step: number) => {
    analyticsService.trackOnboardingStep(step + 1, enhancedOnboardingSteps[step].id, false);
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Header Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: 'white' }}>Welcome back, {user?.full_name}! 🎉</h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', marginTop: '0.5rem' }}>
              Role: <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>{user?.role}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
            {isOnboardingComplete && (
              <button className="btn btn-outline btn-sm" onClick={handleRestartTour} style={{ background: 'white', color: '#667eea' }}>
                📚 Restart Tour
              </button>
            )}
            <button 
              className="btn btn-sm" 
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid white' }}
              onClick={() => addNotification({ 
                type: 'success', 
                title: 'Test Notification', 
                message: 'Real-time notifications are working!' 
              })}
            >
              🔔 Test Notifications
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 style={{ marginBottom: '1rem', marginTop: '2rem' }}>⚡ Quick Actions</h2>
      <div className="grid grid-cols-3">
        <Link 
          to="/vehicle-lookup" 
          className="card" 
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', transition: 'all 0.3s' }}
          data-onboarding="vehicle-lookup"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '';
          }}
        >
          <h3>🔍 Vehicle Lookup</h3>
          <p>Search for vehicle information by VIN or license plate</p>
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--primary-color)', fontWeight: 600 }}>
            Powered by NHTSA →
          </div>
        </Link>

        <Link 
          to="/registration" 
          className="card" 
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', transition: 'all 0.3s' }}
          data-onboarding="registration"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '';
          }}
        >
          <h3>📝 Register Vehicle</h3>
          <p>File new registration or renew existing registration</p>
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--secondary-color)', fontWeight: 600 }}>
            5 min process →
          </div>
        </Link>

        <Link 
          to="/title-transfer" 
          className="card" 
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', transition: 'all 0.3s' }}
          data-onboarding="title-transfer"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '';
          }}
        >
          <h3>🔄 Title Transfer</h3>
          <p>Process title transfers including family and out-of-state</p>
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--warning-color)', fontWeight: 600 }}>
            Secure & Fast →
          </div>
        </Link>
      </div>

      {/* Statistics Dashboard */}
      <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>📊 Platform Statistics</h2>
      <div className="grid grid-cols-3">
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <h4 style={{ color: 'rgba(255,255,255,0.9)' }}>Services Available</h4>
          <p style={{ fontSize: '3rem', fontWeight: 700, margin: '1rem 0' }}>All</p>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>Full access to all features</p>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
          <h4 style={{ color: 'rgba(255,255,255,0.9)' }}>Processing Time</h4>
          <p style={{ fontSize: '3rem', fontWeight: 700, margin: '1rem 0' }}>&lt; 5 min</p>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>Average service completion</p>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
          <h4 style={{ color: 'rgba(255,255,255,0.9)' }}>Support Available</h4>
          <p style={{ fontSize: '3rem', fontWeight: 700, margin: '1rem 0' }}>24/7</p>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>Round-the-clock assistance</p>
        </div>
      </div>

      {/* Platform Features */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>✨ Enhanced Platform Features</h3>
        <div className="grid grid-cols-2" style={{ marginTop: '1rem' }}>
          <div>
            <h4>🚗 Vehicle Services</h4>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '2', color: 'var(--text-secondary)' }}>
              <li>Real-time DMV data access via NHTSA API</li>
              <li>Automated registration status checking</li>
              <li>Intelligent fee calculation & quotes</li>
              <li>Complete ownership history lookup</li>
              <li>Stolen vehicle verification</li>
              <li>Safety recall information</li>
            </ul>
          </div>

          <div>
            <h4>⚡ Professional Tools</h4>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '2', color: 'var(--text-secondary)' }}>
              <li>Real-time notifications & updates</li>
              <li>Payment processing (Stripe integrated)</li>
              <li>Analytics & performance tracking</li>
              <li>WebSocket live updates</li>
              <li>Mobile-optimized responsive design</li>
              <li>Comprehensive audit logging</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Live Updates */}
      {liveUpdates.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3>🔴 Live Updates</h3>
          <div style={{ marginTop: '1rem' }}>
            {liveUpdates.slice(-5).map((update, index) => (
              <div key={index} style={{ 
                padding: '0.75rem', 
                background: 'var(--bg-secondary)', 
                borderRadius: '0.5rem', 
                marginBottom: '0.5rem' 
              }}>
                {JSON.stringify(update)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Placeholder */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <h3>📈 Recent Activity</h3>
        </div>
        <p className="text-center text-secondary" style={{ padding: '2rem' }}>
          No recent activity to display. Start by looking up a vehicle or filing a new registration!
        </p>
      </div>

      {/* Enhanced Onboarding Tour */}
      {showTour && (
        <OnboardingTourEnhanced
          steps={enhancedOnboardingSteps}
          onComplete={handleCompleteTour}
          onSkip={handleSkipTour}
          onStepChange={handleStepChange}
        />
      )}
    </div>
  );
};

export default DashboardEnhanced;
