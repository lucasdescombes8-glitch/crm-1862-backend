import { Request, Response, NextFunction } from 'express';
import { extractToken, verifyToken, JwtPayload } from '../utils/jwt';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * Extend Express Request with authenticated user
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authentication middleware - validates JWT token
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        error: {
          statusCode: 401,
          message: 'Token d\'authentification manquant',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    logger.warn(`Authentication error: ${error}`);
    return res.status(401).json({
      error: {
        statusCode: 401,
        message: 'Token invalide ou expirÃ©',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Authorization middleware - checks user role
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          statusCode: 401,
          message: 'Authentification requise',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Authorization denied for user ${req.user.userId}: insufficient role`
      );
      return res.status(403).json({
        error: {
          statusCode: 403,
          message: 'Vous n\'avez pas les permissions requises',
        },
      });
    }

    next();
  };
};

/**
 * Optional authentication - sets user if token exists, doesn't error if missing
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req.headers.authorization);

    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
    }
  } catch (error) {
    // Silently ignore invalid tokens for optional auth
    logger.debug(`Optional auth skipped: ${error}`);
  }

  next();
};
