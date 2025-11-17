type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      return JSON.stringify(entry, null, 2);
    }
    return JSON.stringify(entry);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    const formatted = this.formatLog(entry);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }

    // Send to external monitoring service if configured
    this.sendToMonitoring(entry);
  }

  private async sendToMonitoring(entry: LogEntry) {
    // Only send errors and warnings in production
    if (process.env.NODE_ENV !== 'production') return;
    if (!['error', 'warn'].includes(entry.level)) return;

    try {
      // Example: Send to Sentry, LogRocket, etc.
      if (process.env.SENTRY_DSN) {
        // Implement Sentry integration here
      }
    } catch (error) {
      // Don't let logging errors crash the app
      console.error('Failed to send log to monitoring:', error);
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, context, error);
  }

  // Performance logging
  logApiCall(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    context?: Record<string, any>
  ) {
    this.info(`API ${method} ${path}`, {
      method,
      path,
      statusCode,
      durationMs,
      ...context,
    });
  }

  // Database query logging
  logDbQuery(query: string, durationMs: number, success: boolean) {
    const truncatedQuery = query.length > 100 ? query.substring(0, 100) + '...' : query;
    const context = {
      query,
      durationMs,
      success,
    };

    if (success) {
      this.debug(`DB Query: ${truncatedQuery}`, context);
    } else {
      this.error(`DB Query: ${truncatedQuery}`, undefined, context);
    }
  }
}

export const logger = new Logger();
