import path from 'path';
import fs from 'fs';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { isProd } from '@/config/env';

const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => `${ts} [${level}] ${stack || message}`),
);

const fileFormat = combine(timestamp(), errors({ stack: true }), json());

/**
 * Central Winston logger with separate error/combined/request logs.
 * Uses daily rotation in production; console output in dev.
 */
export const logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: fileFormat,
  defaultMeta: { service: 'bda-api' },
  transports: [
    new DailyRotateFile({
      dirname: logDir,
      filename: 'error-%DATE%.log',
      level: 'error',
      maxFiles: '30d',
    }),
    new DailyRotateFile({
      dirname: logDir,
      filename: 'combined-%DATE%.log',
      maxFiles: '14d',
    }),
  ],
  exitOnError: false,
});

/** Dedicated stream for HTTP request logging (used by requestLogger middleware). */
export const requestLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  transports: [
    new DailyRotateFile({
      dirname: logDir,
      filename: 'request-%DATE%.log',
      maxFiles: '14d',
    }),
  ],
});

if (!isProd) {
  logger.add(new winston.transports.Console({ format: consoleFormat }));
}
