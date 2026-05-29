import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { devisVersionService } from './DevisVersionService';
import { auditLogService } from './AuditLogService';

const prisma = new PrismaClient();

export interface DevisCreateInput {
  optionId: string;
  services: Array<{ id: string; label: string; montantHT: number }>;
  montantHT: number;
  montantTTC: number;
}

export interface DevisUpdateInput {
  services?: Array<{ id: string; label: string; montantHT: number }>;
  montantHT?: number;
  montantTTC?: number;
  statut?: string;
}

/**
 * DevisService - Manage quotes with automatic versioning
 */
export class DevisService {
  /**
   * Generate unique devis numero (DEV-YYYY-NNN)
   */
  private async generateNumero(): Promise<string> {
    const year = new Date().getFullYear();

    // Get highest number for this year
    const latestDevis = await prisma.devis.findFirst({
      where: {
        numero: {
          startsWith: `DEV-${year}-`,
        },
      },
      orderBy: {
        numero: 'desc',
      },
      select: {
        numero: true,
      },
    });

    let nextNumber = 1;
    if (latestDevis) {
      const match = latestDevis.numero.match(/DEV-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `DEV-${year}-${String(nextNumber).padStart(3, '0')}`;
  }

  /**
   * Get all devis with pagination and filters
   */
  async getAll(
    skip: number = 0,
    take: number = 25,
    filters?: {
      statut?: string;
      optionId?: string;
      searchText?: string;
    }
  ): Promise<{ devis: any[]; pagination: any }> {
    try {
      const where: any = {};

      if (filters?.statut) {
        where.statut = filters.statut;
      }

      if (filters?.optionId) {
        where.optionId = filters.optionId;
      }

      if (filters?.searchText) {
        where.OR = [
          { numero: { contains: filters.searchText, mode: 'insensitive' } },
        ];
      }

      const [devis, total] = await Promise.all([
        prisma.devis.findMany({
          where,
          include: {
            option: {
              include: {
                evenement: {
                  include: {
                    client: true,
                  },
                },
              },
            },
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
            factures: true,
          },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.devis.count({ where }),
      ]);

      return {
        devis,
        pagination: {
          skip,
          take,
          total,
          pages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      logger.error(`Failed to get devis: ${error}`);
      throw new AppError('Failed to fetch quotes', 500);
    }
  }

  /**
   * Get devis by ID with versions
   */
  async getById(id: string): Promise<any> {
    try {
      const devis = await prisma.devis.findUnique({
        where: { id },
        include: {
          option: {
            include: {
              evenement: {
                include: {
                  client: true,
                },
              },
            },
          },
          versions: {
            orderBy: { versionNumber: 'desc' },
          },
          factures: true,
        },
      });

      if (!devis) {
        throw new AppError('Quote not found', 404);
      }

      return devis;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to get devis: ${error}`);
      throw new AppError('Failed to fetch quote', 500);
    }
  }

  /**
   * Create new devis
   */
  async create(input: DevisCreateInput, userId: string): Promise<any> {
    try {
      // Verify option exists
      const option = await prisma.option.findUnique({
        where: { id: input.optionId },
      });

      if (!option) {
        throw new AppError('Option not found', 404);
      }

      // Generate unique numero
      const numero = await this.generateNumero();

      // Create devis
      const devis = await prisma.devis.create({
        data: {
          numero,
          optionId: input.optionId,
          services: input.services as Prisma.JsonArray,
          montantHT: new Prisma.Decimal(input.montantHT),
          montantTTC: new Prisma.Decimal(input.montantTTC),
          statut: 'brouillon',
        },
        include: {
          option: true,
        },
      });

      // Create initial version
      await devisVersionService.createVersion({
        devisId: devis.id,
        services: input.services,
        montantHT: input.montantHT,
        montantTTC: input.montantTTC,
        createdById: userId,
      });

      // Log to audit trail
      await auditLogService.logAction({
        entityType: 'DEVIS',
        entityId: devis.id,
        userId,
        action: 'INSERT',
        changes: {
          numero: { old: null, new: numero },
          statut: { old: null, new: 'brouillon' },
          montantTTC: { old: null, new: input.montantTTC },
        },
      });

      logger.info(`Devis created: ${devis.id}`);

      return devis;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to create devis: ${error}`);
      throw new AppError('Failed to create quote', 500);
    }
  }

  /**
   * Update devis (creates new version if already sent)
   */
  async update(id: string, input: DevisUpdateInput, userId: string): Promise<any> {
    try {
      const current = await prisma.devis.findUnique({
        where: { id },
      });

      if (!current) {
        throw new AppError('Quote not found', 404);
      }

      // If devis already sent and being modified, create new version
      if (current.statut === 'envoye' && (input.services || input.montantHT || input.montantTTC)) {
        const newServices = input.services || (current.services as any);
        const newMontantHT = input.montantHT || Number(current.montantHT);
        const newMontantTTC = input.montantTTC || Number(current.montantTTC);

        await devisVersionService.createVersion({
          devisId: id,
          services: newServices,
          montantHT: newMontantHT,
          montantTTC: newMontantTTC,
          createdById: userId,
        });
      }

      // Update devis
      const updated = await prisma.devis.update({
        where: { id },
        data: {
          ...(input.services && { services: input.services as Prisma.JsonArray }),
          ...(input.montantHT && { montantHT: new Prisma.Decimal(input.montantHT) }),
          ...(input.montantTTC && { montantTTC: new Prisma.Decimal(input.montantTTC) }),
          ...(input.statut && { statut: input.statut }),
        },
        include: {
          option: true,
        },
      });

      // Log to audit trail
      const changes: Record<string, any> = {};
      if (input.statut && input.statut !== current.statut) {
        changes.statut = { old: current.statut, new: input.statut };
      }
      if (input.montantTTC && Number(input.montantTTC) !== Number(current.montantTTC)) {
        changes.montantTTC = { old: Number(current.montantTTC), new: input.montantTTC };
      }

      if (Object.keys(changes).length > 0) {
        await auditLogService.logAction({
          entityType: 'DEVIS',
          entityId: id,
          userId,
          action: 'UPDATE',
          changes,
        });
      }

      logger.info(`Devis updated: ${id}`);

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to update devis: ${error}`);
      throw new AppError('Failed to update quote', 500);
    }
  }

  /**
   * Delete devis
   */
  async delete(id: string, userId: string): Promise<{ message: string }> {
    try {
      const devis = await prisma.devis.findUnique({
        where: { id },
      });

      if (!devis) {
        throw new AppError('Quote not found', 404);
      }

      // Cannot delete if factures exist
      const facturesCount = await prisma.facture.count({
        where: { devisId: id },
      });

      if (facturesCount > 0) {
        throw new AppError('Cannot delete quote with associated invoices', 400);
      }

      // Delete devis (cascade deletes versions)
      await prisma.devis.delete({
        where: { id },
      });

      // Log to audit trail
      await auditLogService.logAction({
        entityType: 'DEVIS',
        entityId: id,
        userId,
        action: 'DELETE',
        changes: {
          numero: { old: devis.numero, new: null },
          statut: { old: devis.statut, new: null },
        },
      });

      logger.info(`Devis deleted: ${id}`);

      return { message: 'Quote deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to delete devis: ${error}`);
      throw new AppError('Failed to delete quote', 500);
    }
  }

  /**
   * Send devis to client (change status to ENVOYÃ‰)
   */
  async send(id: string, userId: string): Promise<any> {
    try {
      const devis = await prisma.devis.findUnique({
        where: { id },
      });

      if (!devis) {
        throw new AppError('Quote not found', 404);
      }

      if (devis.statut === 'envoye') {
        throw new AppError('Quote already sent', 400);
      }

      const updated = await prisma.devis.update({
        where: { id },
        data: {
          statut: 'envoye',
          dateEnvoi: new Date(),
        },
      });

      // Log to audit trail
      await auditLogService.logAction({
        entityType: 'DEVIS',
        entityId: id,
        userId,
        action: 'UPDATE',
        changes: {
          statut: { old: devis.statut, new: 'envoye' },
          dateEnvoi: { old: null, new: new Date() },
        },
      });

      logger.info(`Devis sent: ${id}`);

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to send devis: ${error}`);
      throw new AppError('Failed to send quote', 500);
    }
  }

  /**
   * Accept devis (client accepted)
   */
  async accept(id: string, userId: string): Promise<any> {
    try {
      const devis = await prisma.devis.findUnique({
        where: { id },
      });

      if (!devis) {
        throw new AppError('Quote not found', 404);
      }

      if (devis.statut !== 'envoye') {
        throw new AppError('Only sent quotes can be accepted', 400);
      }

      const updated = await prisma.devis.update({
        where: { id },
        data: {
          statut: 'accepte',
        },
      });

      // Log to audit trail
      await auditLogService.logAction({
        entityType: 'DEVIS',
        entityId: id,
        userId,
        action: 'UPDATE',
        changes: {
          statut: { old: 'envoye', new: 'accepte' },
        },
      });

      logger.info(`Devis accepted: ${id}`);

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to accept devis: ${error}`);
      throw new AppError('Failed to accept quote', 500);
    }
  }

  /**
   * Reject devis
   */
  async reject(id: string, userId: string, reason?: string): Promise<any> {
    try {
      const devis = await prisma.devis.findUnique({
        where: { id },
      });

      if (!devis) {
        throw new AppError('Quote not found', 404);
      }

      const updated = await prisma.devis.update({
        where: { id },
        data: {
          statut: 'refusÃ©',
        },
      });

      // Log to audit trail
      await auditLogService.logAction({
        entityType: 'DEVIS',
        entityId: id,
        userId,
        action: 'UPDATE',
        changes: {
          statut: { old: devis.statut, new: 'refusÃ©' },
          ...(reason && { reason: { old: null, new: reason } }),
        },
      });

      logger.info(`Devis rejected: ${id}`);

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to reject devis: ${error}`);
      throw new AppError('Failed to reject quote', 500);
    }
  }

  /**
   * Get devis history
   */
  async getHistory(devisId: string): Promise<any[]> {
    try {
      return await auditLogService.getHistory('DEVIS', devisId);
    } catch (error) {
      logger.error(`Failed to get devis history: ${error}`);
      return [];
    }
  }
}

export const devisService = new DevisService();
