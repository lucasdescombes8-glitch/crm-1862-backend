import { Router, Request, Response } from 'express';
import { userService } from '../services/UserService';
import { LoginSchema, RegisterSchema } from '../types/validation';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = LoginSchema.parse(req.body);

    // Login user
    const result = await userService.login(validatedData);

    logger.info(`User logged in: ${result.user.email}`);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && 'errors' in error) {
      // Zod validation error
      return res.status(400).json({
        error: {
          statusCode: 400,
          message: 'DonnÃ©es invalides',
          details: (error as any).errors,
        },
      });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          statusCode: error.statusCode,
          message: error.message,
        },
      });
    }

    logger.error(`Login error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la connexion',
      },
    });
  }
});

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = RegisterSchema.parse(req.body);

    // Register user
    const result = await userService.register(validatedData);

    logger.info(`New user registered: ${result.user.email}`);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && 'errors' in error) {
      // Zod validation error
      return res.status(400).json({
        error: {
          statusCode: 400,
          message: 'DonnÃ©es invalides',
          details: (error as any).errors,
        },
      });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          statusCode: error.statusCode,
          message: error.message,
        },
      });
    }

    logger.error(`Register error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de l\'enregistrement',
      },
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (token invalidation handled client-side)
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  logger.info(`User logged out: ${req.user?.email}`);

  res.status(200).json({
    success: true,
    message: 'DÃ©connexion rÃ©ussie',
  });
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token (for future implementation)
 */
router.post('/refresh', async (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Token refresh (to be implemented)',
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError('Utilisateur non authentifiÃ©', 401);
    }

    const user = await userService.getUserById(req.user.userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          statusCode: error.statusCode,
          message: error.message,
        },
      });
    }

    logger.error(`Get current user error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la rÃ©cupÃ©ration de l\'utilisateur',
      },
    });
  }
});

export default router;
