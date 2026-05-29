import { Router, Request, Response } from 'express';
import { optionService } from '../services/OptionService';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

const OptionCreateSchema = z.object({
  evenementId: z.string().uuid(),
  heureDebugMontage: z.string().datetime(),
  heureOuverturePublic: z.string().datetime(),
  heureFermeturePublic: z.string().datetime(),
  heureFinDemolition: z.string().datetime(),
  paxEstime: z.number().positive(),
  salleIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const OptionUpdateSchema = z.object({
  heureDebugMontage: z.string().datetime().optional(),
  heureOuverturePublic: z.string().datetime().optional(),
  heureFermeturePublic: z.string().datetime().optional(),
  heureFinDemolition: z.string().datetime().optional(),
  paxEstime: z.number().positive().optional(),
  salleIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

router.use(authenticate);

// GET /api/options/event/:evenementId - Get all options for event
router.get('/event/:evenementId', async (req: Request, res: Response) => {
  try {
    const options = await optionService.getAll(req.params.evenementId);

    res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    logger.error(Get options error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la récupération des options' },
    });
  }
});

// GET /api/options/:id - Get option detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const option = await optionService.getById(req.params.id);

    res.status(200).json({
      success: true,
      data: option,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: { statusCode: error.statusCode, message: error.message },
      });
    }

    logger.error(Get option error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la récupération de l\'option' },
    });
  }
});

// POST /api/options - Create option
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = OptionCreateSchema.parse(req.body);
    const option = await optionService.create(validated, req.user!.userId);

    res.status(201).json({
      success: true,
      data: option,
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

    logger.error(Create option error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la création de l\'option' },
    });
  }
});

// PATCH /api/options/:id - Update option
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const validated = OptionUpdateSchema.parse(req.body);
    const option = await optionService.update(req.params.id, validated);

    res.status(200).json({
      success: true,
      data: option,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: { statusCode: error.statusCode, message: error.message },
      });
    }

    logger.error(Update option error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la mise à jour de l\'option' },
    });
  }
});

// DELETE /api/options/:id - Delete option
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await optionService.delete(req.params.id);

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

    logger.error(Delete option error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la suppression de l\'option' },
    });
  }
});

export default router;
