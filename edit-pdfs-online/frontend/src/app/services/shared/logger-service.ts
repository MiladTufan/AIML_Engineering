import { Injectable, isDevMode } from '@angular/core';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private isDev = isDevMode();

  private log(level: LogLevel, message: string, ...optional: any[]): void {
    if (!this.isDev && level === 'debug') {
      // Skip debug logs in production
      return;
    }
    let className = '';
    if (optional != null && optional.length > 0) className = optional[0];

    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] [${level.toUpperCase()}] [${className}]  ${message}`;

    switch (level) {
      case 'debug':
        console.debug(`${logMsg}`);
        break;
      case 'info':
        console.info(`${logMsg}`);
        break;
      case 'warn':
        console.warn(`${logMsg}`);
        break;
      case 'error':
        console.error(`${logMsg}`);
        break;
    }
  }

  debug(message: string, ...optional: any[]): void {
    this.log('debug', message, ...optional);
  }
  info(message: string, ...optional: any[]): void {
    this.log('info', message, ...optional);
  }
  warn(message: string, ...optional: any[]): void {
    this.log('warn', message, ...optional);
  }
  error(message: string, ...optional: any[]): void {
    this.log('error', message, ...optional);
  }
}
