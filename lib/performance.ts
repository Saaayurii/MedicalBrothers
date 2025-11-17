import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
}

// Web Vitals thresholds
const thresholds = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[metricName as keyof typeof thresholds];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

export function reportWebVital(metric: any) {
  const performanceMetric: PerformanceMetric = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    logger.info(`Web Vital: ${metric.name}`, performanceMetric);
  }

  // Send to analytics
  sendToAnalytics(performanceMetric);
}

function sendToAnalytics(metric: PerformanceMetric) {
  // Send to Google Analytics if configured
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.rating,
      non_interaction: true,
    });
  }

  // Send to custom analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
      keepalive: true,
    }).catch((error) => {
      logger.error('Failed to send vitals', error);
    });
  }
}

// Declare gtag type for TypeScript
declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
  }
}

// Performance marker utility
export class PerformanceTracker {
  private marks: Map<string, number> = new Map();

  start(name: string) {
    this.marks.set(name, performance.now());
  }

  end(name: string): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      logger.warn(`Performance mark "${name}" not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    logger.debug(`Performance: ${name}`, { duration });
    return duration;
  }

  measure(name: string, fn: () => void | Promise<void>): void | Promise<void> {
    this.start(name);
    const result = fn();

    if (result instanceof Promise) {
      return result.finally(() => this.end(name));
    }

    this.end(name);
  }
}

export const perfTracker = new PerformanceTracker();
