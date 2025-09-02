import { config } from './config.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m'  // Red
};

const RESET_COLOR = '\x1b[0m';

class Logger {
  private currentLevel: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.currentLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.currentLevel];
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const color = COLORS[level];
    const levelStr = level.toUpperCase().padEnd(5);
    
    const formattedArgs = args.length > 0 ? 
      ' ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') : 
      '';
    
    return `${color}[${timestamp}] ${levelStr}${RESET_COLOR} ${message}${formattedArgs}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, ...args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, ...args));
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, ...args));
    }
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }
}

export const logger = new Logger(config.logLevel as LogLevel);


