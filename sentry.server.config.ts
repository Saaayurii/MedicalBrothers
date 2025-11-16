import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  environment: process.env.NODE_ENV,

  // Filter out health check and non-error events
  beforeSend(event, hint) {
    // Don't send errors from health check endpoints
    if (event.request?.url?.includes('/api/health')) {
      return null;
    }

    // Don't send Prisma connection errors in development
    if (
      process.env.NODE_ENV === 'development' &&
      event.exception?.values?.[0]?.type?.includes('PrismaClient')
    ) {
      return null;
    }

    return event;
  },

  // Ignore specific errors
  ignoreErrors: [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNRESET',
  ],
});
