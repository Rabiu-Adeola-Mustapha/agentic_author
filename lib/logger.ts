// lib/logger.ts
type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface Logger {
  error: (message: string, ...meta: any[]) => void;
  warn: (message: string, ...meta: any[]) => void;
  info: (message: string, ...meta: any[]) => void;
  debug: (message: string, ...meta: any[]) => void;
  trace: (message: string, ...meta: any[]) => void;
}

let logger: Logger;

if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
  // We are in Node.js runtime
  const winston = require('winston');
  const path = require('path');

  const isDev = process.env.NODE_ENV !== 'production';
  const getLogsDir = () => {
    try {
      return path.join(process.cwd(), 'logs');
    } catch {
      return '/tmp/logs';
    }
  };
  const logsDir = getLogsDir();

  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4,
  };

  const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
    trace: 'gray',
  };

  winston.addColors(colors);

  const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, ...meta }: any) => {
      let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta, null, 2)}`;
      }
      return msg;
    })
  );

  const winstonLogger = winston.createLogger({
    levels,
    format,
    transports: [
      new winston.transports.Console({
        level: isDev ? 'debug' : 'info',
        format: winston.format.combine(winston.format.colorize(), format),
      }),
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format,
      }),
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format,
      }),
    ],
  });

  logger = winstonLogger;
} else {
  // Fallback for Edge Runtime or Browser
  logger = {
    error: (msg, ...meta) => console.error(`[ERROR] ${msg}`, ...meta),
    warn: (msg, ...meta) => console.warn(`[WARN] ${msg}`, ...meta),
    info: (msg, ...meta) => console.info(`[INFO] ${msg}`, ...meta),
    debug: (msg, ...meta) => console.debug(`[DEBUG] ${msg}`, ...meta),
    trace: (msg, ...meta) => console.log(`[TRACE] ${msg}`, ...meta),
  };
}

export default logger;
