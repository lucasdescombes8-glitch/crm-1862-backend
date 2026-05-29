import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { auditLogService } from './AuditLogService';

const prisma = new PrismaClient();

export interface EvenementCreateInput {
  titre: string;
  type: string;
  clientId: string;
  paxEstime: number;
  statut?: string;
  notes?: string;
}

export interface EvenementUpdateInput {
  titre?: string;
  type?: string;
  clientId?: string;
  paxEstime?: number;
  statut?: string;
  notes?: string;
}

export interface EvenementDetail {
  id: string;
  titre: string;
  type: string;
  client: {
    id: string;
    nom: string;
    email?: string;
  };
  paxEstime: number;
  statut: string;
  notes?: string;
  options: any[];
  taches: any[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * EvenementService - Manage events for customers
 * Tracks changes via AuditLog for full history
 */
export class EvenementService {
  /**
   * Get all events with pagination
   */
  async getAll(
    skip: number = 0,
    take: number = 25,
    filters?: {
      statut?: string;
      clientId?: string;
      searchText?: string;
    }
  ): Promise<{ evenements: any[]; pagination: any }> {
    try {
      const where: any = {};

      if (filters?.statut) {
        where.statut = filters.statut;
      }

      if (filters?.clientId) {
        where.clientId = filters.clientId;
      }

      if (filters?.searchText) {
        where.OR = [
          { titre: { contains: filters.searchText, mode: 'insensitive' } },
          { type: { contains: filters.searchText, mode: 'insensitive' } },
        ];
      }

      const [evenements, total] = await Promise.all([
        prisma.evenement.findMany({
          where,
          include: {
            client: {
              select: {
                id: true,
                nom: true,
                email: true,
              },
            },
            options: true,
            taches: true,
          },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.evenement.count({ where }),
      ]);

      return {
        evenements,
        pagination: {
          skip,
          take,
          total,
          pages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      logger.error(`Failed to get evenements: ${error}`);
      throw new AppError('Failed to fetch events', 500);
    }
  }

  /**
   * Get event by ID with full details
   */
  async getById(id: string): Promise<EvenementDetail> {
    try {
      const evenement = await prisma.evenement.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              nom: true,
              email: true,
            },
          },
          options: {
            include: {
              devis: {
                include: {
                  versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1,
                  },
                },
              },
            },
          },
          taches: {
            include: {
              assignee: {
                select: {
                  id: true,
                  nom: true,
                  prenom: true,
                },
              },
            },
          },
        },
      });

      if (!evenement) {
        throw new AppError('Event not found', 404);
      }

      return evenement as EvenementDetail;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to get evenement: ${error}`);
      throw new AppError('Failed to fetch event', 500);
    }
  }

  /**
   * Create new event
   */
  async create(input: EvenementCreateInput, userId: string): Promise<any> {
    try {
      // Verify client exists
      const client = await prisma.contact.findUnique({
        where: { id: input.clientId },
      });

      if (!client) {
        throw new AppError('Client not found', 404);
      }

      // Create evenement
      const evenement = await prisma.evenement.create({
        data: {
          titre: input.titre,
          type: input.type,
          clientId: input.clientId,
          paxEstime: input.paxEstime,
          statut: input.statut || 'proposition',
          notes: input.notes,
        },
        include: {
          client: {
            select: {
              id: true,
              nom: true,
              email: true,
            },
          },
        },
      });

      // Log to audit trail
      await auditLogService.logAction({
        entityType: 'EVENEMENT',
        entityId: evenement.id,
        userId,
        action: 'INSERT',
        changes: {
          titre: { old: null, new: input.titre },
          type: { old: null, new: input.type },
          statut: { old: null, new: input.statut || 'proposition' },
          paxEstime: { old: null, new: input.paxEstime },
        },
      });

      logger.info(`Event created: ${evenement.id}`);

      return evenement;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to create evenement: ${error}`);
      throw new AppError('Failed to create event', 500);
    }
  }

  /**
   * Update event
   */
  async update(id: string, input: EvenementUpdateInput, userId: string): Promise<any> {
    try {
      // Get current state for audit
      const current = await prisma.evenement.findUnique({
        where: { id },
      });

      if (!current) {
        throw new AppError('Event not found', 404);
      }

      // Verify client if changed
      if (input.clientId && input.clientId !== current.clientId) {
        const client = await prisma.contact.findUnique({
          where: { id: input.clientId },
        });
        if (!client) {
          throw new AppError('Client not found', 404);
        }
      }

      // Update event
      const updated = await prisma.evenement.update({
        where: { id },
        data: {
          ...(input.titre && { titre: input.titre }),
          ...(input.type && { type: input.type }),
          ...(input.clientId && { clientId: input.clientId }),
          ...(input.paxEstime && { paxEstime: input.paxEstime }),
          ...(input.statut && { statut: input.statut }),
          ...(input.notes !== undefined && { notes: input.notes }),
        },
        include: {
          client: {
            select: {
              id: true,
              nom: true,
              email: true,
            },
          },
        },
      });

      // Calculate changes for audit
      const changes: Record<string, any> = {};
      if (input.titre && input.titre !== current.titre) {
        changes.titre = { old: current.titre, new: input.titre };
      }
      if (input.type && input.type !== current.type) {
        changes.type = { old: current.type, new: input.type };
      }
      if (input.statut && input.statut !== current.statut) {
        changes.statut = { old: current.statut, new: input.statut };
      }
      if (input.paxEstime && input.paxEstime !== current.paxEstime) {
        changes.paxEstime = { old: current.paxEstime, new: input.paxEstime };
      }
      if (input.notes !== undefined && input.notes !== current.notes) {
        changes.notes = { old: current.notes, new: input.notes };
      }

      // Log to audit trail
      if (Object.keys(changes).length > 0) {
        await auditLogService.logAction({
          entityType: 'EVENEMENT',
          entityId: id,
          userId,
          action: 'UPDATE',
          changes,
        });
      }

      logger.info(`Event updated: ${id}`);

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to update evenement: ${error}`);
      throw new AppError('Failed to update event', 500);
    }
  }

  /**
   * Delete event
   */
  async delete(id: string, userId: string): Promise<{ message: string }> {
    try {
      const evenement = await prisma.evenement.findUnique({
        where: { id },
      });

      if (!evenement) {
        throw new AppError('Event not found', 404);
      }

      // Delete event (cascade deletes options, taches, etc)
      await prisma.evenement.delete({
        where: { id },
      });

      // Log to audit trail
      await auditLogService.logAction({
        entityType: 'EVENEMENT',
        entityId: id,
        userId,
        action: 'DELETE',
        changes: {
          titre: { old: evenement.titre, new: null },
          statut: { old: evenement.statut, new: null },
        },
      });

      logger.info(`Event deleted: ${id}`);

      return { message: 'Event deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to delete evenement: ${error}`);
      throw new AppError('Failed to delete event', 500);
    }
  }

  /**
   * Get events by status
   */
  async getByStatus(statut: string): Promise<any[]> {
    try {
      return await prisma.evenement.findMany({
        where: { statut },
        include: {
          client: {
            select: {
              id: true,
              nom: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error(`Failed to get evenements by status: ${error}`);
      throw new AppError('Failed to fetch events', 500);
    }
  }

  /**
   * Get events by client
   */
  async getByClient(clientId: string): Promise<any[]> {
    try {
      return await prisma.evenement.findMany({
        where: { clientId },
        include: {
          options: {
            include: {
              devis: true,
            },
          },
          taches: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error(`Failed to get evenements by client: ${error}`);
      throw new AppError('Failed to fetch events', 500);
    }
  }

  /**
   * Get event history
   */
  async getHistory(evenementId: string): Promise<any[]> {
    try {
      return await auditLogService.getEvenementHistory(evenementId);
    } catch (error) {
      logger.error(`Failed to get event history: ${error}`);
      return [];
    }
  }
}

export const evenementService = new EvenementService();
