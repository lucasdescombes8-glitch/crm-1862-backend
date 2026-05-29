import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { auditLogService } from './AuditLogService';

const prisma = new PrismaClient();

export class FactureService {
  /**
   * Generate unique facture numero (FACT-YYYY-NNN)
   */
  private async generateNumero(): Promise<string> {
    const year = new Date().getFullYear();
    const latestFacture = await prisma.facture.findFirst({
      where: { numero: { startsWith: `FACT-${year}-` } },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });

    let nextNumber = 1;
    if (latestFacture) {
      const match = latestFacture.numero.match(/FACT-\d+-(\d+)/);
      if (match) nextNumber = parseInt(match[1]) + 1;
    }

    return `FACT-${year}-${String(nextNumber).padStart(3, '0')}`;
  }

  /**
   * Create facture from devis (auto-generation)
   */
  async createFromDevis(devisId: string, userId: string): Promise<any> {
    try {
      const devis = await prisma.devis.findUnique({
        where: { id: devisId },
      });

      if (!devis) throw new AppError('Devis not found', 404);
      if (devis.statut !== 'accepte') throw new AppError('Only accepted devis can be invoiced', 400);

      // Check if facture already exists
      const existingFacture = await prisma.facture.findFirst({
        where: { devisId },
      });

      if (existingFacture) throw new AppError('Facture already exists for this devis', 400);

      const numero = await this.generateNumero();

      const facture = await prisma.facture.create({
        data: {
          numero,
          devisId,
          montantTTC: devis.montantTTC,
          statutPaiement: 'impayee',
        },
      });

      await auditLogService.logAction({
        entityType: 'FACTURE',
        entityId: facture.id,
        userId,
        action: 'INSERT',
        changes: {
          numero: { old: null, new: numero },
          montantTTC: { old: null, new: Number(devis.montantTTC) },
        },
      });

      logger.info(`Facture created from devis: ${facture.id}`);
      return facture;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to create facture: ${error}`);
      throw new AppError('Failed to create invoice', 500);
    }
  }

  /**
   * Get all factures
   */
  async getAll(skip: number = 0, take: number = 25, filters?: any): Promise<any> {
    try {
      const where: any = {};
      if (filters?.statutPaiement) where.statutPaiement = filters.statutPaiement;

      const [factures, total] = await Promise.all([
        prisma.facture.findMany({
          where,
          include: { devis: { include: { option: true } } },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.facture.count({ where }),
      ]);

      return { factures, pagination: { skip, take, total, pages: Math.ceil(total / take) } };
    } catch (error) {
      logger.error(`Failed to get factures: ${error}`);
      throw new AppError('Failed to fetch invoices', 500);
    }
  }

  /**
   * Get facture by ID
   */
  async getById(id: string): Promise<any> {
    try {
      const facture = await prisma.facture.findUnique({
        where: { id },
        include: { devis: { include: { option: { include: { evenement: true } } } } },
      });

      if (!facture) throw new AppError('Facture not found', 404);
      return facture;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to get facture: ${error}`);
      throw new AppError('Failed to fetch invoice', 500);
    }
  }

  /**
   * Record payment
   */
  async recordPayment(id: string, montantRecu: number, userId: string): Promise<any> {
    try {
      const facture = await prisma.facture.findUnique({ where: { id } });
      if (!facture) throw new AppError('Facture not found', 404);

      const montantTTC = Number(facture.montantTTC);
      const totalRecu = (Number(facture.montantRecu) || 0) + montantRecu;

      let newStatut = 'partiellement_payee';
      if (totalRecu >= montantTTC) {
        newStatut = 'payee';
      }

      const updated = await prisma.facture.update({
        where: { id },
        data: {
          montantRecu: new Prisma.Decimal(totalRecu),
          statutPaiement: newStatut,
          datePaiement: newStatut === 'payee' ? new Date() : undefined,
        },
      });

      await auditLogService.logAction({
        entityType: 'FACTURE',
        entityId: id,
        userId,
        action: 'UPDATE',
        changes: {
          montantRecu: { old: Number(facture.montantRecu) || 0, new: totalRecu },
          statutPaiement: { old: facture.statutPaiement, new: newStatut },
        },
      });

      logger.info(`Payment recorded for facture: ${id}`);
      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to record payment: ${error}`);
      throw new AppError('Failed to record payment', 500);
    }
  }

  /**
   * Delete facture
   */
  async delete(id: string, userId: string): Promise<any> {
    try {
      const facture = await prisma.facture.findUnique({ where: { id } });
      if (!facture) throw new AppError('Facture not found', 404);

      if (Number(facture.montantRecu) > 0) {
        throw new AppError('Cannot delete facture with payments recorded', 400);
      }

      await prisma.facture.delete({ where: { id } });

      await auditLogService.logAction({
        entityType: 'FACTURE',
        entityId: id,
        userId,
        action: 'DELETE',
      });

      logger.info(`Facture deleted: ${id}`);
      return { message: 'Invoice deleted' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to delete facture: ${error}`);
      throw new AppError('Failed to delete invoice', 500);
    }
  }

  /**
   * Get unpaid factures
   */
  async getUnpaid(): Promise<any[]> {
    try {
      return await prisma.facture.findMany({
        where: { statutPaiement: { in: ['impayee', 'partiellement_payee'] } },
        include: { devis: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error(`Failed to get unpaid factures: ${error}`);
      return [];
    }
  }
}

export const factureService = new FactureService();
