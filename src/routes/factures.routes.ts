import { Router, Request, Response } from 'express';
import { factureService } from '../services/FactureService';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

const FacturePaymentSchema = z.object({
  montantRecu: z.number().positive(),
});

router.use(authenticate);

// GET /api/factures - List all factures
router.get('/', async (req: Request, res: Response) => {
  try {
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 25;
    const statutPaiement = req.query.statutPaiement as string | undefined;

    const result = await factureService.getAll(skip, take, { statutPaiement });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error(Get factures error: {error});
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la récupération des factures',
      },
    });
  }
});

// GET /api/factures/unpaid - Get unpaid invoices for dashboard
router.get('/unpaid', async (req: Request, res: Response) => {
  try {
    const unpaid = await factureService.getUnpaid();

    res.status(200).json({
      success: true,
      data: unpaid,
    });
  } catch (error) {
    logger.error(Get unpaid factures error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la récupération des factures impayées' },
    });
  }
});

// GET /api/factures/:id - Get facture detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const facture = await factureService.getById(req.params.id);

    res.status(200).json({
      success: true,
      data: facture,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: { statusCode: error.statusCode, message: error.message },
      });
    }

    logger.error(Get facture error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la récupération de la facture' },
    });
  }
});

// POST /api/factures/from-devis/:devisId - Create facture from devis
router.post('/from-devis/:devisId', async (req: Request, res: Response) => {
  try {
    const facture = await factureService.createFromDevis(req.params.devisId, req.user!.userId);

    res.status(201).json({
      success: true,
      data: facture,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: { statusCode: error.statusCode, message: error.message },
      });
    }

    logger.error(Create facture from devis error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la création de la facture' },
    });
  }
});

// POST /api/factures/:id/payment - Record payment
router.post('/:id/payment', async (req: Request, res: Response) => {
  try {
    const validated = FacturePaymentSchema.parse(req.body);
    const facture = await factureService.recordPayment(req.params.id, validated.montantRecu, req.user!.userId);

    res.status(200).json({
      success: true,
      data: facture,
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

    logger.error(Record payment error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de l\'enregistrement du paiement' },
    });
  }
});

// DELETE /api/factures/:id - Delete facture
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await factureService.delete(req.params.id, req.user!.userId);

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

    logger.error(Delete facture error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la suppression de la facture' },
    });
  }
});

export default router;
