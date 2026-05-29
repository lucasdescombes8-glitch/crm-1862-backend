import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Log request
  logger.http(`${req.method} ${req.path}`);

  // Capture response
  const originalSend = res.send;

  res.send = function (data: any) {
    const duration = Date.now() - startTime;

    logger.http(
      `${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );

    return originalSend.call(this, data);
  };

  next();
};
