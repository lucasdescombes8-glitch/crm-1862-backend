import { Router, Request, Response } from 'express';
import { adminService } from '../services/AdminService';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

const ServiceCreateSchema = z.object({
  nom: z.string().min(1),
  code: z.string().min(1),
  categorie: z.string().min(1),
  montantDefaut: z.number().positive(),
});

const SalleCreateSchema = z.object({
  nom: z.string().min(1),
  zone: z.string().min(1),
  capacite: z.number().positive(),
  superficie: z.number().positive(),
});

const GrilleTarifUpdateSchema = z.object({
  montantHeure: z.number().positive(),
});

const UserRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'user']),
});

router.use(authenticate);

// GET /api/admin/users - Get all users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await adminService.getAllUsers();

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    logger.error(Get users error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la récupération des utilisateurs' },
    });
  }
});

// PATCH /api/admin/users/:userId/role - Update user role
router.patch('/users/:userId/role', async (req: Request, res: Response) => {
  try {
    const validated = UserRoleSchema.parse(req.body);
    const user = await adminService.updateUserRole(req.params.userId, validated.role);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: { statusCode: error.statusCode, message: error.message },
      });
    }

    logger.error(Update user role error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la mise à jour du rôle' },
    });
  }
});

// GET /api/admin/audit-logs - Get audit logs
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await adminService.getAuditLogs(limit);

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    logger.error(Get audit logs error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la récupération des logs d\'audit' },
    });
  }
});

// GET /api/admin/audit-logs/:entityType/:entityId - Get entity audit logs
router.get('/audit-logs/:entityType/:entityId', async (req: Request, res: Response) => {
  try {
    const logs = await adminService.getAuditLogsByEntity(req.params.entityType, req.params.entityId);

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    logger.error(Get entity audit logs error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la récupération des logs' },
    });
  }
});

// GET /api/admin/services - Get all services
router.get('/services', async (req: Request, res: Response) => {
  try {
    const services = await adminService.getAllServices();

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    logger.error(Get services error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la récupération des services' },
    });
  }
});

// POST /api/admin/services - Create service
router.post('/services', async (req: Request, res: Response) => {
  try {
    const validated = ServiceCreateSchema.parse(req.body);
    const service = await adminService.createService(validated);

    res.status(201).json({
      success: true,
      data: service,
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

    logger.error(Create service error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la création du service' },
    });
  }
});

// GET /api/admin/salles - Get all salles
router.get('/salles', async (req: Request, res: Response) => {
  try {
    const salles = await adminService.getAllSalles();

    res.status(200).json({
      success: true,
      data: salles,
    });
  } catch (error) {
    logger.error(Get salles error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la récupération des salles' },
    });
  }
});

// POST /api/admin/salles - Create salle
router.post('/salles', async (req: Request, res: Response) => {
  try {
    const validated = SalleCreateSchema.parse(req.body);
    const salle = await adminService.createSalle(validated);

    res.status(201).json({
      success: true,
      data: salle,
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

    logger.error(Create salle error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la création de la salle' },
    });
  }
});

// GET /api/admin/tarif-grid - Get pricing grid
router.get('/tarif-grid', async (req: Request, res: Response) => {
  try {
    const grid = await adminService.getAllGrilleTarif();

    res.status(200).json({
      success: true,
      data: grid,
    });
  } catch (error) {
    logger.error(Get tarif grid error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la récupération de la grille tarifaire' },
    });
  }
});

// PATCH /api/admin/tarif-grid/:id - Update pricing
router.patch('/tarif-grid/:id', async (req: Request, res: Response) => {
  try {
    const validated = GrilleTarifUpdateSchema.parse(req.body);
    const updated = await adminService.updateGrilleTarif(req.params.id, validated.montantHeure);

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: { statusCode: error.statusCode, message: error.message },
      });
    }

    logger.error(Update tarif error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la mise à jour du tarif' },
    });
  }
});

// GET /api/admin/statistics - Get dashboard statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getStatistics();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error(Get statistics error: {error});
    res.status(500).json({
      error: { statusCode: 500, message: 'Erreur lors de la récupération des statistiques' },
    });
  }
});

export default router;
