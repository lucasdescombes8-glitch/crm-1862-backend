import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class TacheService {
  async getAll(skip: number = 0, take: number = 25, filters?: any): Promise<any> {
    try {
      const where: any = {};
      if (filters?.statut) where.statut = filters.statut;
      if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
      if (filters?.evenementId) where.evenementId = filters.evenementId;

      const [taches, total] = await Promise.all([
        prisma.tache.findMany({
          where,
          include: { assignee: true, evenement: true },
          skip,
          take,
          orderBy: { dueDate: 'asc' },
        }),
        prisma.tache.count({ where }),
      ]);

      return { taches, pagination: { skip, take, total, pages: Math.ceil(total / take) } };
    } catch (error) {
      logger.error(`Failed to get taches: ${error}`);
      throw new AppError('Failed to fetch tasks', 500);
    }
  }

  async getById(id: string): Promise<any> {
    try {
      const tache = await prisma.tache.findUnique({
        where: { id },
        include: { assignee: true, evenement: true },
      });
      if (!tache) throw new AppError('Task not found', 404);
      return tache;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to get tache: ${error}`);
      throw new AppError('Failed to fetch task', 500);
    }
  }

  async create(input: any): Promise<any> {
    try {
      return await prisma.tache.create({
        data: {
          titre: input.titre,
          evenementId: input.evenementId,
          statut: input.statut || 'a_faire',
          priorite: input.priorite || 'normale',
          assigneeId: input.assigneeId,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        },
        include: { assignee: true, evenement: true },
      });
    } catch (error) {
      logger.error(`Failed to create tache: ${error}`);
      throw new AppError('Failed to create task', 500);
    }
  }

  async update(id: string, input: any): Promise<any> {
    try {
      return await prisma.tache.update({
        where: { id },
        data: {
          ...(input.titre && { titre: input.titre }),
          ...(input.statut && { statut: input.statut }),
          ...(input.priorite && { priorite: input.priorite }),
          ...(input.assigneeId && { assigneeId: input.assigneeId }),
          ...(input.dueDate && { dueDate: new Date(input.dueDate) }),
        },
        include: { assignee: true, evenement: true },
      });
    } catch (error) {
      logger.error(`Failed to update tache: ${error}`);
      throw new AppError('Failed to update task', 500);
    }
  }

  async changeStatus(id: string, newStatus: string): Promise<any> {
    try {
      return await prisma.tache.update({
        where: { id },
        data: { statut: newStatus },
      });
    } catch (error) {
      logger.error(`Failed to change status: ${error}`);
      throw new AppError('Failed to update task status', 500);
    }
  }

  async delete(id: string): Promise<any> {
    try {
      await prisma.tache.delete({ where: { id } });
      return { message: 'Task deleted' };
    } catch (error) {
      logger.error(`Failed to delete tache: ${error}`);
      throw new AppError('Failed to delete task', 500);
    }
  }

  async getKanban(evenementId: string): Promise<any> {
    try {
      const taches = await prisma.tache.findMany({
        where: { evenementId },
        include: { assignee: true },
        orderBy: [{ priorite: 'desc' }, { dueDate: 'asc' }],
      });

      return {
        a_faire: taches.filter(t => t.statut === 'a_faire'),
        en_cours: taches.filter(t => t.statut === 'en_cours'),
        terminee: taches.filter(t => t.statut === 'terminee'),
      };
    } catch (error) {
      logger.error(`Failed to get kanban: ${error}`);
      throw new AppError('Failed to fetch kanban', 500);
    }
  }
}

export const tacheService = new TacheService();
