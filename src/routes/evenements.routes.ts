import { Router, Request, Response } from 'express';
import { evenementService } from '../services/EvenementService';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const EvenementCreateSchema = z.object({
  titre: z.string().min(3).max(255),
  type: z.string().min(1).max(100),
  clientId: z.string().uuid(),
  paxEstime: z.number().int().positive(),
  statut: z.enum(['proposition', 'confirme', 'refusÃ©']).optional(),
  notes: z.string().optional(),
});

const EvenementUpdateSchema = z.object({
  titre: z.string().min(3).max(255).optional(),
  type: z.string().min(1).max(100).optional(),
  clientId: z.string().uuid().optional(),
  paxEstime: z.number().int().positive().optional(),
  statut: z.enum(['proposition', 'confirme', 'refusÃ©']).optional(),
  notes: z.string().optional(),
});

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/evenements
 * Get all events with pagination and filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 25;
    const statut = req.query.statut as string | undefined;
    const clientId = req.query.clientId as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await evenementService.getAll(skip, take, {
      statut,
      clientId,
      searchText: search,
    });

    res.status(200).json({
      success: true,
      data: result,
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

    logger.error(`Get evenements error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la rÃ©cupÃ©ration des Ã©vÃ©nements',
      },
    });
  }
});

/**
 * GET /api/evenements/:id
 * Get event details with all related data
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const evenement = await evenementService.getById(req.params.id);

    res.status(200).json({
      success: true,
      data: evenement,
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

    logger.error(`Get evenement error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la rÃ©cupÃ©ration de l\'Ã©vÃ©nement',
      },
    });
  }
});

/**
 * POST /api/evenements
 * Create new event
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = EvenementCreateSchema.parse(req.body);

    const evenement = await evenementService.create(validatedData, req.user!.userId);

    logger.info(`Event created: ${evenement.id}`);

    res.status(201).json({
      success: true,
      data: evenement,
    });
  } catch (error) {
    if (error instanceof Error && 'errors' in error) {
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

    logger.error(`Create event error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la crÃ©ation de l\'Ã©vÃ©nement',
      },
    });
  }
});

/**
 * PATCH /api/evenements/:id
 * Update event
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = EvenementUpdateSchema.parse(req.body);

    const evenement = await evenementService.update(req.params.id, validatedData, req.user!.userId);

    logger.info(`Event updated: ${req.params.id}`);

    res.status(200).json({
      success: true,
      data: evenement,
    });
  } catch (error) {
    if (error instanceof Error && 'errors' in error) {
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

    logger.error(`Update event error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la mise Ã  jour de l\'Ã©vÃ©nement',
      },
    });
  }
});

/**
 * DELETE /api/evenements/:id
 * Delete event
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await evenementService.delete(req.params.id, req.user!.userId);

    logger.info(`Event deleted: ${req.params.id}`);

    res.status(200).json({
      success: true,
      message: result.message,
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

    logger.error(`Delete event error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la suppression de l\'Ã©vÃ©nement',
      },
    });
  }
});

/**
 * GET /api/evenements/:id/history
 * Get event change history (audit log)
 */
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const history = await evenementService.getHistory(req.params.id);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error(`Get event history error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la rÃ©cupÃ©ration de l\'historique',
      },
    });
  }
});

/**
 * GET /api/evenements/statut/:statut
 * Get events by status
 */
router.get('/statut/:statut', async (req: Request, res: Response) => {
  try {
    const events = await evenementService.getByStatus(req.params.statut);

    res.status(200).json({
      success: true,
      data: events,
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

    logger.error(`Get events by status error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la rÃ©cupÃ©ration des Ã©vÃ©nements',
      },
    });
  }
});

/**
 * GET /api/evenements/client/:clientId
 * Get events by client
 */
router.get('/client/:clientId', async (req: Request, res: Response) => {
  try {
    const events = await evenementService.getByClient(req.params.clientId);

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    logger.error(`Get events by client error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la rÃ©cupÃ©ration des Ã©vÃ©nements',
      },
    });
  }
});

export default router;
