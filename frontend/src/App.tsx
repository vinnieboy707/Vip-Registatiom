import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardEnhanced from './pages/DashboardEnhanced';
import VehicleLookup from './pages/VehicleLookup';
import Registration from './pages/Registration';
import TitleTransfer from './pages/TitleTransfer';
import VehicleReport from './pages/VehicleReport';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <NotificationProvider>
          <Router>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <Navbar />
              <main style={{ flex: 1 }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <DashboardEnhanced />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/dashboard/basic"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/vehicle-lookup"
                    element={
                      <PrivateRoute>
                        <VehicleLookup />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/registration"
                    element={
                      <PrivateRoute>
                        <Registration />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/title-transfer"
                    element={
                      <PrivateRoute>
                        <TitleTransfer />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/vehicle-report"
                    element={
                      <PrivateRoute>
                        <VehicleReport />
                      </PrivateRoute>
                    }
                  />
                </Routes>
              </main>
              <footer
                style={{
                  background: 'var(--bg-primary)',
                  borderTop: '1px solid var(--border-color)',
                  padding: '2rem 0',
                  marginTop: '3rem',
                }}
              >
                <div className="container text-center">
                  <p className="text-secondary">
                    © 2026 DMV Vehicle Registration Platform. All rights reserved.
                  </p>
                  <p className="text-secondary text-sm" style={{ marginTop: '0.5rem' }}>
                    Production-grade full-stack application with enterprise security & complete platform integrations
                  </p>
                </div>
              </footer>
            </div>
          </Router>
        </NotificationProvider>
      </OnboardingProvider>
    </AuthProvider>
  );
};

export default App;
