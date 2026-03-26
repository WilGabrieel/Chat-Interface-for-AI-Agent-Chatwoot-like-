import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log error
  console.error(`[${new Date().toISOString()}] Error:`, {
    statusCode,
    message,
    path: req.path,
    method: req.method,
    ...(config.isDevelopment && { stack: err.stack }),
  });

  // Don't expose stack traces in production
  const response: any = {
    error: message,
    statusCode,
  };

  if (config.isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
