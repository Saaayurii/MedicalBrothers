/**
 * Google Analytics 4 Library
 * Handles analytics tracking and custom events
 */

import { logger } from './logger';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export interface GAEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export interface GAPageView {
  page_path: string;
  page_title?: string;
}

export interface GAUserProperties {
  user_type?: 'patient' | 'doctor' | 'admin';
  user_id?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Google Analytics Manager
 */
export class AnalyticsManager {
  private measurementId: string;
  private isEnabled: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    this.measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';
    this.isEnabled = !!this.measurementId && typeof window !== 'undefined';
  }

  /**
   * Initialize Google Analytics
   */
  initialize(): void {
    if (!this.isEnabled || this.isInitialized) {
      return;
    }

    try {
      // Create gtag script
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      script.async = true;
      document.head.appendChild(script);

      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer!.push(arguments);
      };

      window.gtag('js', new Date());
      window.gtag('config', this.measurementId, {
        send_page_view: false, // We'll handle page views manually
      });

      this.isInitialized = true;
      logger.info('Google Analytics initialized', { measurementId: this.measurementId });
    } catch (error) {
      logger.error('Failed to initialize Google Analytics', error as Error);
    }
  }

  /**
   * Track page view
   */
  pageView(data: GAPageView): void {
    if (!this.isEnabled || !window.gtag) {
      return;
    }

    try {
      window.gtag('event', 'page_view', {
        page_path: data.page_path,
        page_title: data.page_title || document.title,
      });

      logger.debug('GA: Page view tracked', data);
    } catch (error) {
      logger.error('GA: Failed to track page view', error as Error);
    }
  }

  /**
   * Track custom event
   */
  event(event: GAEvent): void {
    if (!this.isEnabled || !window.gtag) {
      return;
    }

    try {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
      });

      logger.debug('GA: Event tracked', event);
    } catch (error) {
      logger.error('GA: Failed to track event', error as Error);
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: GAUserProperties): void {
    if (!this.isEnabled || !window.gtag) {
      return;
    }

    try {
      window.gtag('set', 'user_properties', properties);
      logger.debug('GA: User properties set', properties);
    } catch (error) {
      logger.error('GA: Failed to set user properties', error as Error);
    }
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    if (!this.isEnabled || !window.gtag) {
      return;
    }

    try {
      window.gtag('config', this.measurementId, {
        user_id: userId,
      });
      logger.debug('GA: User ID set', { userId });
    } catch (error) {
      logger.error('GA: Failed to set user ID', error as Error);
    }
  }

  /**
   * Track appointment events
   */
  trackAppointment(action: 'create' | 'cancel' | 'complete', appointmentId: string): void {
    this.event({
      action,
      category: 'Appointment',
      label: appointmentId,
    });
  }

  /**
   * Track AI assistant usage
   */
  trackAssistantMessage(messageLength: number): void {
    this.event({
      action: 'send_message',
      category: 'AI Assistant',
      value: messageLength,
    });
  }

  /**
   * Track file uploads
   */
  trackFileUpload(fileType: string, fileSize: number): void {
    this.event({
      action: 'upload',
      category: 'File Upload',
      label: fileType,
      value: Math.round(fileSize / 1024), // Size in KB
    });
  }

  /**
   * Track video consultation
   */
  trackVideoConsultation(action: 'start' | 'join' | 'end', duration?: number): void {
    this.event({
      action,
      category: 'Video Consultation',
      value: duration,
    });
  }

  /**
   * Track authentication events
   */
  trackAuth(action: 'login' | 'logout' | 'register', userType: string): void {
    this.event({
      action,
      category: 'Authentication',
      label: userType,
    });
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: string): void {
    this.event({
      action: 'error',
      category: 'Error',
      label: `${context || 'Unknown'}: ${error.message}`,
    });
  }

  /**
   * Track search
   */
  trackSearch(searchTerm: string): void {
    this.event({
      action: 'search',
      category: 'Search',
      label: searchTerm,
    });
  }

  /**
   * Track form submission
   */
  trackFormSubmit(formName: string, success: boolean): void {
    this.event({
      action: success ? 'submit_success' : 'submit_error',
      category: 'Form',
      label: formName,
    });
  }

  /**
   * Track button click
   */
  trackButtonClick(buttonName: string, location?: string): void {
    this.event({
      action: 'click',
      category: 'Button',
      label: location ? `${location}: ${buttonName}` : buttonName,
    });
  }

  /**
   * Track navigation
   */
  trackNavigation(from: string, to: string): void {
    this.event({
      action: 'navigate',
      category: 'Navigation',
      label: `${from} -> ${to}`,
    });
  }

  /**
   * Check if analytics is enabled
   */
  isAnalyticsEnabled(): boolean {
    return this.isEnabled && this.isInitialized;
  }
}

// Export singleton instance
export const analytics = new AnalyticsManager();

// Auto-initialize on client side
if (typeof window !== 'undefined') {
  analytics.initialize();
}

/**
 * React hook for analytics
 */
export function useAnalytics() {
  return {
    pageView: (data: GAPageView) => analytics.pageView(data),
    event: (event: GAEvent) => analytics.event(event),
    setUserProperties: (properties: GAUserProperties) => analytics.setUserProperties(properties),
    setUserId: (userId: string) => analytics.setUserId(userId),
    trackAppointment: (action: 'create' | 'cancel' | 'complete', appointmentId: string) =>
      analytics.trackAppointment(action, appointmentId),
    trackAssistantMessage: (messageLength: number) =>
      analytics.trackAssistantMessage(messageLength),
    trackFileUpload: (fileType: string, fileSize: number) =>
      analytics.trackFileUpload(fileType, fileSize),
    trackVideoConsultation: (action: 'start' | 'join' | 'end', duration?: number) =>
      analytics.trackVideoConsultation(action, duration),
    trackAuth: (action: 'login' | 'logout' | 'register', userType: string) =>
      analytics.trackAuth(action, userType),
    trackError: (error: Error, context?: string) => analytics.trackError(error, context),
    trackSearch: (searchTerm: string) => analytics.trackSearch(searchTerm),
    trackFormSubmit: (formName: string, success: boolean) =>
      analytics.trackFormSubmit(formName, success),
    trackButtonClick: (buttonName: string, location?: string) =>
      analytics.trackButtonClick(buttonName, location),
    trackNavigation: (from: string, to: string) => analytics.trackNavigation(from, to),
  };
}
