import React, { createContext, useContext, useState, useEffect } from 'react';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  shouldShowOnboarding: boolean;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem('onboarding_completed');
    if (completed === 'true') {
      setIsOnboardingComplete(true);
      setShouldShowOnboarding(false);
    } else {
      setIsOnboardingComplete(false);
      // Will trigger onboarding on first login
    }
  }, []);

  const startOnboarding = () => {
    setShouldShowOnboarding(true);
  };

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsOnboardingComplete(true);
    setShouldShowOnboarding(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsOnboardingComplete(true);
    setShouldShowOnboarding(false);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        shouldShowOnboarding,
        startOnboarding,
        completeOnboarding,
        skipOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
