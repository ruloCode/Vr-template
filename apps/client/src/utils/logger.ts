import { isDebug } from "./config";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS: Record<LogLevel, string> = {
  debug: "#8B5CF6", // Purple
  info: "#10B981", // Green
  warn: "#F59E0B", // Yellow
  error: "#EF4444", // Red
};

class ClientLogger {
  private currentLevel: LogLevel = isDebug ? "debug" : "info";

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.currentLevel];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    ...args: any[]
  ): [string, string, ...any[]] {
    const timestamp = new Date().toISOString().substr(11, 12);
    const color = COLORS[level];
    const prefix = `%c[${timestamp}] VR-${level.toUpperCase()}`;
    const style = `color: ${color}; font-weight: bold;`;

    return [prefix, style, message, ...args];
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog("debug")) {
      console.log(...this.formatMessage("debug", message, ...args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog("info")) {
      console.log(...this.formatMessage("info", message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog("warn")) {
      console.warn(...this.formatMessage("warn", message, ...args));
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog("error")) {
      console.error(...this.formatMessage("error", message, ...args));
    }
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  group(label: string): void {
    if (isDebug) {
      console.group(`🔍 ${label}`);
    }
  }

  groupEnd(): void {
    if (isDebug) {
      console.groupEnd();
    }
  }

  time(label: string): void {
    if (isDebug) {
      console.time(`⏱️ ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (isDebug) {
      console.timeEnd(`⏱️ ${label}`);
    }
  }

  table(data: any): void {
    if (isDebug) {
      console.table(data);
    }
  }
}

export const logger = new ClientLogger();

// Performance monitoring
export const perf = {
  mark: (name: string) => {
    if (isDebug && "performance" in window) {
      performance.mark(name);
    }
  },

  measure: (name: string, startMark: string, endMark?: string) => {
    if (isDebug && "performance" in window) {
      try {
        if (endMark) {
          performance.measure(name, startMark, endMark);
        } else {
          performance.measure(name, startMark);
        }

        const measure = performance.getEntriesByName(name)[0];
        logger.debug(`⚡ ${name}: ${measure.duration.toFixed(2)}ms`);
      } catch (error) {
        logger.warn(`Could not measure ${name}:`, error);
      }
    }
  },
};

// Error boundary helper
export const captureError = (error: Error, context?: string) => {
  logger.error(`${context ? `[${context}] ` : ""}Captured error:`, {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
  });

  // In production, you might want to send this to an error tracking service
  if (!isDebug) {
    // Example: errorTrackingService.captureException(error, { context });
  }
};
