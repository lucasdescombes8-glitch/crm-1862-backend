import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isDev = process.env.NODE_ENV === 'development';

  // Log error
  logger.error(`${error.name}: ${error.message}`);

  // Set default status code and message
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database error';
  }

  if (error.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
  }

  // Handle JSON parse errors
  if (error instanceof SyntaxError) {
    statusCode = 400;
    message = 'Invalid JSON';
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      statusCode,
      message,
      ...(isDev && { stack: error.stack, details: error.message }),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};
