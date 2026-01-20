import React, { useState, useEffect } from 'react';
import './OnboardingTour.css';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    path?: string;
  };
}

interface OnboardingTourProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const step = steps[currentStep];

  useEffect(() => {
    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        
        // Calculate tooltip position based on target element
        let top = 0;
        let left = 0;

        switch (step.position) {
          case 'bottom':
            top = rect.bottom + 20;
            left = rect.left + rect.width / 2;
            break;
          case 'top':
            top = rect.top - 20;
            left = rect.left + rect.width / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left - 20;
            break;
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right + 20;
            break;
          default:
            top = window.innerHeight / 2;
            left = window.innerWidth / 2;
        }

        setTooltipPosition({ top, left });

        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Center the tooltip if no target
      setTooltipPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
      });
    }
  }, [currentStep, step]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="onboarding-overlay" />

      {/* Spotlight on target element */}
      {step.targetSelector && (
        <div className="onboarding-spotlight" data-target={step.targetSelector} />
      )}

      {/* Tooltip */}
      <div
        className={`onboarding-tooltip ${step.position || 'center'}`}
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        <div className="onboarding-tooltip-header">
          <h3>{step.title}</h3>
          <button className="onboarding-close-btn" onClick={onSkip} aria-label="Close tour">
            ✕
          </button>
        </div>

        <div className="onboarding-tooltip-body">
          <p>{step.description}</p>
        </div>

        <div className="onboarding-tooltip-footer">
          <div className="onboarding-progress">
            <div className="onboarding-progress-bar" style={{ width: `${progress}%` }} />
          </div>

          <div className="onboarding-step-indicator">
            Step {currentStep + 1} of {steps.length}
          </div>

          <div className="onboarding-actions">
            {currentStep > 0 && (
              <button className="btn btn-outline btn-sm" onClick={handlePrevious}>
                Previous
              </button>
            )}
            <button className="btn btn-sm" onClick={onSkip}>
              Skip Tour
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;
