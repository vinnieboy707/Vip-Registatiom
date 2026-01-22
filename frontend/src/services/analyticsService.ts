/**
 * Analytics Service for tracking user interactions and events
 * Supports Google Analytics, Mixpanel, and custom analytics
 */

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  customData?: Record<string, any>;
}

interface UserProperties {
  userId?: string;
  role?: string;
  plan?: string;
  [key: string]: any;
}

class AnalyticsService {
  private isInitialized = false;
  private userId: string | null = null;

  /**
   * Initialize analytics services
   */
  initialize() {
    if (this.isInitialized) return;

    // Initialize Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      console.log('[Analytics] Google Analytics initialized');
    }

    // Initialize Mixpanel (if available)
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      console.log('[Analytics] Mixpanel initialized');
    }

    this.isInitialized = true;
  }

  /**
   * Identify user for analytics tracking
   */
  identifyUser(userId: string, properties?: UserProperties) {
    this.userId = userId;

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        user_id: userId,
        ...properties,
      });
    }

    // Mixpanel
    if ((window as any).mixpanel) {
      (window as any).mixpanel.identify(userId);
      if (properties) {
        (window as any).mixpanel.people.set(properties);
      }
    }

    console.log('[Analytics] User identified:', userId);
  }

  /**
   * Track custom event
   */
  trackEvent(event: AnalyticsEvent) {
    if (!this.isInitialized) {
      this.initialize();
    }

    const { category, action, label, value, customData } = event;

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        ...customData,
      });
    }

    // Mixpanel
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track(`${category}_${action}`, {
        label,
        value,
        ...customData,
      });
    }

    console.log('[Analytics] Event tracked:', event);
  }

  /**
   * Track page view
   */
  trackPageView(pagePath: string, pageTitle?: string) {
    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle,
      });
    }

    // Mixpanel
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track('Page View', {
        page: pagePath,
        title: pageTitle,
      });
    }

    console.log('[Analytics] Page view tracked:', pagePath);
  }

  /**
   * Track onboarding progress
   */
  trackOnboardingStep(stepNumber: number, stepName: string, completed: boolean) {
    this.trackEvent({
      category: 'Onboarding',
      action: completed ? 'step_completed' : 'step_viewed',
      label: stepName,
      value: stepNumber,
      customData: {
        step_number: stepNumber,
        step_name: stepName,
      },
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureName: string, action: string, metadata?: Record<string, any>) {
    this.trackEvent({
      category: 'Feature',
      action: `${featureName}_${action}`,
      customData: metadata,
    });
  }

  /**
   * Track errors
   */
  trackError(errorType: string, errorMessage: string, errorStack?: string) {
    this.trackEvent({
      category: 'Error',
      action: errorType,
      label: errorMessage,
      customData: {
        error_stack: errorStack,
        user_id: this.userId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track conversion events
   */
  trackConversion(conversionType: string, value?: number, currency?: string) {
    this.trackEvent({
      category: 'Conversion',
      action: conversionType,
      value: value,
      customData: {
        currency: currency || 'USD',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track time spent
   */
  trackTimeSpent(category: string, label: string, timeInSeconds: number) {
    this.trackEvent({
      category: 'Engagement',
      action: 'time_spent',
      label: `${category}_${label}`,
      value: timeInSeconds,
      customData: {
        category,
        label,
        duration_seconds: timeInSeconds,
      },
    });
  }

  /**
   * Track search queries
   */
  trackSearch(query: string, resultsCount: number, category?: string) {
    this.trackEvent({
      category: 'Search',
      action: 'search_performed',
      label: query,
      value: resultsCount,
      customData: {
        query,
        results_count: resultsCount,
        category,
      },
    });
  }

  /**
   * Track button clicks
   */
  trackButtonClick(buttonName: string, location: string) {
    this.trackEvent({
      category: 'Interaction',
      action: 'button_click',
      label: buttonName,
      customData: {
        button_name: buttonName,
        location,
      },
    });
  }

  /**
   * Track form submissions
   */
  trackFormSubmission(formName: string, success: boolean, errorMessage?: string) {
    this.trackEvent({
      category: 'Form',
      action: success ? 'submit_success' : 'submit_failure',
      label: formName,
      customData: {
        form_name: formName,
        success,
        error_message: errorMessage,
      },
    });
  }
}

export const analyticsService = new AnalyticsService();

export default analyticsService;
