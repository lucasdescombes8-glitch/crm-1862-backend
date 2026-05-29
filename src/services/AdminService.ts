import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class AdminService {
  // Users Management
  async getAllUsers(): Promise<any[]> {
    try {
      return await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          statut: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error(`Failed to get users: ${error}`);
      throw new AppError('Failed to fetch users', 500);
    }
  }

  async updateUserRole(userId: string, role: string): Promise<any> {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, email: true, role: true },
      });
    } catch (error) {
      logger.error(`Failed to update user role: ${error}`);
      throw new AppError('Failed to update user', 500);
    }
  }

  // Audit Logs
  async getAuditLogs(limit: number = 100): Promise<any[]> {
    try {
      return await prisma.auditLog.findMany({
        include: { user: { select: { email: true, nom: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error(`Failed to get audit logs: ${error}`);
      throw new AppError('Failed to fetch audit logs', 500);
    }
  }

  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<any[]> {
    try {
      return await prisma.auditLog.findMany({
        where: { entityType, entityId },
        include: { user: { select: { email: true, nom: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error(`Failed to get entity audit logs: ${error}`);
      return [];
    }
  }

  // Services Management
  async getAllServices(): Promise<any[]> {
    try {
      return await prisma.service.findMany({
        where: { actif: true },
        orderBy: { categorie: 'asc' },
      });
    } catch (error) {
      logger.error(`Failed to get services: ${error}`);
      throw new AppError('Failed to fetch services', 500);
    }
  }

  async createService(input: any): Promise<any> {
    try {
      return await prisma.service.create({
        data: {
          nom: input.nom,
          code: input.code,
          categorie: input.categorie,
          montantDefaut: input.montantDefaut,
        },
      });
    } catch (error) {
      logger.error(`Failed to create service: ${error}`);
      throw new AppError('Failed to create service', 500);
    }
  }

  // Salles Management
  async getAllSalles(): Promise<any[]> {
    try {
      return await prisma.salle.findMany({
        where: { active: true },
        orderBy: { nom: 'asc' },
      });
    } catch (error) {
      logger.error(`Failed to get salles: ${error}`);
      throw new AppError('Failed to fetch rooms', 500);
    }
  }

  async createSalle(input: any): Promise<any> {
    try {
      return await prisma.salle.create({
        data: {
          nom: input.nom,
          zone: input.zone,
          capacite: input.capacite,
          superficie: input.superficie,
        },
      });
    } catch (error) {
      logger.error(`Failed to create salle: ${error}`);
      throw new AppError('Failed to create room', 500);
    }
  }

  // Grille Tarif Management
  async getAllGrilleTarif(): Promise<any[]> {
    try {
      return await prisma.grilleTarif.findMany();
    } catch (error) {
      logger.error(`Failed to get grille tarif: ${error}`);
      throw new AppError('Failed to fetch pricing grid', 500);
    }
  }

  async updateGrilleTarif(id: string, montantHeure: number): Promise<any> {
    try {
      return await prisma.grilleTarif.update({
        where: { id },
        data: { montantHeure },
      });
    } catch (error) {
      logger.error(`Failed to update grille tarif: ${error}`);
      throw new AppError('Failed to update pricing', 500);
    }
  }

  // Statistics
  async getStatistics(): Promise<any> {
    try {
      const [contactsCount, evenementsCount, devisCount, facturesCount, tachesCount] = await Promise.all([
        prisma.contact.count(),
        prisma.evenement.count(),
        prisma.devis.count(),
        prisma.facture.count(),
        prisma.tache.count(),
      ]);

      return {
        contacts: contactsCount,
        evenements: evenementsCount,
        devis: devisCount,
        factures: facturesCount,
        taches: tachesCount,
      };
    } catch (error) {
      logger.error(`Failed to get statistics: ${error}`);
      return {};
    }
  }
}

export const adminService = new AdminService();
