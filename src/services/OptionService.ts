import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class OptionService {
  async getAll(evenementId: string): Promise<any[]> {
    try {
      return await prisma.option.findMany({
        where: { evenementId },
        include: { devis: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error(`Failed to get options: ${error}`);
      throw new AppError('Failed to fetch options', 500);
    }
  }

  async getById(id: string): Promise<any> {
    try {
      const option = await prisma.option.findUnique({
        where: { id },
        include: { devis: { include: { versions: true } }, evenement: true },
      });
      if (!option) throw new AppError('Option not found', 404);
      return option;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to get option: ${error}`);
      throw new AppError('Failed to fetch option', 500);
    }
  }

  async create(input: any, userId: string): Promise<any> {
    try {
      const evenement = await prisma.evenement.findUnique({
        where: { id: input.evenementId },
      });
      if (!evenement) throw new AppError('Evenement not found', 404);

      return await prisma.option.create({
        data: {
          evenementId: input.evenementId,
          heureDebugMontage: new Date(input.heureDebugMontage),
          heureOuverturePublic: new Date(input.heureOuverturePublic),
          heureFermeturePublic: new Date(input.heureFermeturePublic),
          heureFinDemolition: new Date(input.heureFinDemolition),
          paxEstime: input.paxEstime,
          salleIds: JSON.stringify(input.salleIds || []),
          notes: input.notes,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to create option: ${error}`);
      throw new AppError('Failed to create option', 500);
    }
  }

  async update(id: string, input: any): Promise<any> {
    try {
      return await prisma.option.update({
        where: { id },
        data: {
          ...(input.heureDebugMontage && { heureDebugMontage: new Date(input.heureDebugMontage) }),
          ...(input.heureOuverturePublic && { heureOuverturePublic: new Date(input.heureOuverturePublic) }),
          ...(input.heureFermeturePublic && { heureFermeturePublic: new Date(input.heureFermeturePublic) }),
          ...(input.heureFinDemolition && { heureFinDemolition: new Date(input.heureFinDemolition) }),
          ...(input.paxEstime && { paxEstime: input.paxEstime }),
          ...(input.salleIds && { salleIds: JSON.stringify(input.salleIds) }),
          ...(input.notes !== undefined && { notes: input.notes }),
        },
      });
    } catch (error) {
      logger.error(`Failed to update option: ${error}`);
      throw new AppError('Failed to update option', 500);
    }
  }

  async delete(id: string): Promise<any> {
    try {
      await prisma.option.delete({ where: { id } });
      return { message: 'Option deleted' };
    } catch (error) {
      logger.error(`Failed to delete option: ${error}`);
      throw new AppError('Failed to delete option', 500);
    }
  }
}

export const optionService = new OptionService();
