import React, { useState, useEffect, useCallback } from 'react';
import './OnboardingTourEnhanced.css';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    path?: string;
    callback?: () => void;
  };
  interactiveDemo?: {
    type: 'form' | 'click' | 'hover' | 'input';
    element?: string;
    instruction?: string;
  };
  video?: string;
  tips?: string[];
  achievement?: {
    icon: string;
    title: string;
    points: number;
  };
}

interface OnboardingTourEnhancedProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip: () => void;
  onStepChange?: (step: number) => void;
}

const OnboardingTourEnhanced: React.FC<OnboardingTourEnhancedProps> = ({ 
  steps, 
  onComplete, 
  onSkip,
  onStepChange 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [totalPoints, setTotalPoints] = useState(0);
  const [showAchievement, setShowAchievement] = useState(false);
  const [hoveredTip, setHoveredTip] = useState<number | null>(null);

  const step = steps[currentStep];

  // Track analytics
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'onboarding_step', {
        step_number: currentStep + 1,
        step_id: step.id,
        step_title: step.title,
      });
    }
  }, [currentStep, step]);

  // Calculate position with enhanced logic
  const calculatePosition = useCallback(() => {
    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setSpotlightRect(rect);
        
        let top = 0;
        let left = 0;
        const tooltipWidth = 500;
        const tooltipHeight = 400;
        const padding = 30;

        // Enhanced positioning algorithm
        switch (step.position) {
          case 'bottom':
            top = rect.bottom + window.scrollY + padding;
            left = Math.max(padding, Math.min(
              rect.left + rect.width / 2,
              window.innerWidth - tooltipWidth / 2 - padding
            ));
            break;
          case 'top':
            top = rect.top + window.scrollY - tooltipHeight - padding;
            left = Math.max(padding, Math.min(
              rect.left + rect.width / 2,
              window.innerWidth - tooltipWidth / 2 - padding
            ));
            break;
          case 'left':
            top = Math.max(padding, Math.min(
              rect.top + window.scrollY + rect.height / 2,
              window.innerHeight - tooltipHeight / 2
            ));
            left = rect.left - tooltipWidth - padding;
            break;
          case 'right':
            top = Math.max(padding, Math.min(
              rect.top + window.scrollY + rect.height / 2,
              window.innerHeight - tooltipHeight / 2
            ));
            left = rect.right + padding;
            break;
          default:
            top = window.innerHeight / 2 + window.scrollY;
            left = window.innerWidth / 2;
        }

        setTooltipPosition({ top, left });

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        element.scrollIntoView({ 
          behavior: prefersReducedMotion ? 'auto' : 'smooth', 
          block: 'center',
          inline: 'center'
        });
      }
    } else {
      setSpotlightRect(null);
      setTooltipPosition({
        top: window.innerHeight / 2 + window.scrollY,
        left: window.innerWidth / 2,
      });
    }
  }, [step]);

  useEffect(() => {
    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    return () => window.removeEventListener('resize', calculatePosition);
  }, [calculatePosition]);

  const handleNext = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const newCompletedSteps = new Set(completedSteps);
    newCompletedSteps.add(currentStep);
    setCompletedSteps(newCompletedSteps);

    // Award points for achievement
    if (step.achievement && !completedSteps.has(currentStep)) {
      setTotalPoints(prev => prev + (step.achievement?.points || 0));
      setShowAchievement(true);
      setTimeout(() => setShowAchievement(false), 3000);
    }

    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        onStepChange?.(currentStep + 1);
      } else {
        onComplete();
      }
      setIsAnimating(false);
    }, 300);
  };

  const handlePrevious = () => {
    if (isAnimating || currentStep === 0) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(currentStep - 1);
      onStepChange?.(currentStep - 1);
      setIsAnimating(false);
    }, 300);
  };

  const handleDotClick = (index: number) => {
    if (isAnimating || index === currentStep) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(index);
      onStepChange?.(index);
      setIsAnimating(false);
    }, 300);
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSkip();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      handlePrevious();
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const completionRate = (completedSteps.size / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div 
        className="onboarding-overlay-enhanced" 
        onClick={onSkip}
        onKeyDown={handleOverlayKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close onboarding tour"
      />

      {/* Spotlight */}
      {spotlightRect && (
        <div 
          className="onboarding-spotlight-enhanced"
          style={{
            top: `${spotlightRect.top + window.scrollY}px`,
            left: `${spotlightRect.left}px`,
            width: `${spotlightRect.width}px`,
            height: `${spotlightRect.height}px`,
          }}
        />
      )}

      {/* Achievement Popup */}
      {showAchievement && step.achievement && (
        <div className="achievement-popup">
          <div className="achievement-icon">{step.achievement.icon}</div>
          <div className="achievement-content">
            <h4>{step.achievement.title}</h4>
            <p>+{step.achievement.points} points</p>
          </div>
        </div>
      )}

      {/* Enhanced Tooltip */}
      <div
        className={`onboarding-tooltip-enhanced ${step.position || 'center'} ${isAnimating ? 'animating' : ''}`}
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        {/* Header */}
        <div className="onboarding-tooltip-header-enhanced">
          <div className="header-left">
            <h3>{step.title}</h3>
            <div className="points-badge">
              ⭐ {totalPoints} points
            </div>
          </div>
          <button className="onboarding-close-btn-enhanced" onClick={onSkip} aria-label="Close tour">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="onboarding-tooltip-body-enhanced">
          <p className="main-description">{step.description}</p>

          {/* Video Tutorial */}
          {step.video && (
            <div className="video-container">
              <video controls width="100%" poster="/api/placeholder/400/225">
                <source src={step.video} type="video/mp4" />
                Your browser does not support video playback.
              </video>
            </div>
          )}

          {/* Interactive Demo */}
          {step.interactiveDemo && (
            <div className="interactive-demo">
              <div className="demo-badge">🎮 Try it yourself!</div>
              <p className="demo-instruction">{step.interactiveDemo.instruction}</p>
            </div>
          )}

          {/* Tips Section */}
          {step.tips && step.tips.length > 0 && (
            <div className="tips-section">
              <h4>💡 Pro Tips</h4>
              <ul>
                {step.tips.map((tip, index) => (
                  <li 
                    key={index}
                    className={hoveredTip === index ? 'hovered' : ''}
                    onMouseEnter={() => setHoveredTip(index)}
                    onMouseLeave={() => setHoveredTip(null)}
                  >
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="onboarding-tooltip-footer-enhanced">
          {/* Progress Bar with Dots */}
          <div className="progress-section">
            <div className="progress-bar-container">
              <div className="progress-bar-track">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="progress-dots">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    className={`progress-dot ${
                      index === currentStep ? 'active' : ''
                    } ${completedSteps.has(index) ? 'completed' : ''}`}
                    onClick={() => handleDotClick(index)}
                    aria-label={`Go to step ${index + 1}`}
                  >
                    {completedSteps.has(index) ? '✓' : index + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="step-info">
              <span className="step-counter">Step {currentStep + 1} of {steps.length}</span>
              <span className="completion-rate">{Math.round(completionRate)}% Complete</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="onboarding-actions-enhanced">
            {currentStep > 0 && (
              <button 
                className="btn btn-outline btn-sm" 
                onClick={handlePrevious}
                disabled={isAnimating}
              >
                ← Previous
              </button>
            )}
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={onSkip}
            >
              Skip Tour
            </button>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={handleNext}
              disabled={isAnimating}
            >
              {currentStep === steps.length - 1 ? '🎉 Finish' : 'Next →'}
            </button>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="keyboard-hints">
            <span>💡 Use ← → arrow keys to navigate</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTourEnhanced;
