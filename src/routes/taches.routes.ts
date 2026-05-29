import { Router, Request, Response } from 'express';
import { tacheService } from '../services/TacheService';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

const TacheCreateSchema = z.object({
  titre: z.string().min(1),
  evenementId: z.string().uuid(),
  statut: z.enum(['a_faire', 'en_cours', 'terminee']).optional(),
  priorite: z.enum(['basse', 'normale', 'haute']).optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
});

const TacheUpdateSchema = z.object({
  titre: z.string().min(1).optional(),
  statut: z.enum(['a_faire', 'en_cours', 'terminee']).optional(),
  priorite: z.enum(['basse', 'normale', 'haute']).optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
});

router.use(authenticate);

// GET /api/taches - List all taches with pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 25;
    const statut = req.query.statut as string | undefined;
    const assigneeId = req.query.assigneeId as string | undefined;
    const evenementId = req.query.evenementId as string | undefined;

    const result = await tacheService.getAll(skip, take, { statut, assigneeId, evenementId });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error(Get taches error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la récupération des tâches' },
    });
  }
});

// GET /api/taches/:id - Get tache detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tache = await tacheService.getById(req.params.id);

    res.status(200).json({
      success: true,
      data: tache,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: { statusCode: error.statusCode, message: error.message },
      });
    }

    logger.error(Get tache error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la récupération de la tâche' },
    });
  }
});

// POST /api/taches - Create tache
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = TacheCreateSchema.parse(req.body);
    const tache = await tacheService.create(validated);

    res.status(201).json({
      success: true,
      data: tache,
    });
  } catch (error) {
    if (error instanceof Error && 'errors' in error) {
      return res.status(400).json({
        error: {
          statusCode: 400,
          message: 'Données invalides',
          details: (error as any).errors,
        },
      });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: { statusCode: error.statusCode, message: error.message },
      });
    }

    logger.error(Create tache error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la création de la tâche' },
    });
  }
});

// PATCH /api/taches/:id - Update tache
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const validated = TacheUpdateSchema.parse(req.body);
    const tache = await tacheService.update(req.params.id, validated);

    res.status(200).json({
      success: true,
      data: tache,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: { statusCode: error.statusCode, message: error.message },
      });
    }

    logger.error(Update tache error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la mise à jour de la tâche' },
    });
  }
});

// POST /api/taches/:id/status - Change tache status
router.post('/:id/status', async (req: Request, res: Response) => {
  try {
    const statusSchema = z.object({
      statut: z.enum(['a_faire', 'en_cours', 'terminee']),
    });
    const validated = statusSchema.parse(req.body);
    const tache = await tacheService.changeStatus(req.params.id, validated.statut);

    res.status(200).json({
      success: true,
      data: tache,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: { statusCode: error.statusCode, message: error.message },
      });
    }

    logger.error(Change status error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors du changement de statut' },
    });
  }
});

// DELETE /api/taches/:id - Delete tache
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await tacheService.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: { statusCode: error.statusCode, message: error.message },
      });
    }

    logger.error(Delete tache error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la suppression de la tâche' },
    });
  }
});

// GET /api/taches/kanban/:evenementId - Get kanban board
router.get('/kanban/:evenementId', async (req: Request, res: Response) => {
  try {
    const kanban = await tacheService.getKanban(req.params.evenementId);

    res.status(200).json({
      success: true,
      data: kanban,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: { statusCode: error.statusCode, message: error.message },
      });
    }

    logger.error(Get kanban error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la récupération du tableau kanban' },
    });
  }
});

export default router;
