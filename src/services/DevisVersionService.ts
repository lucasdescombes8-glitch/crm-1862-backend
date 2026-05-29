import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export interface DevisVersionInput {
  devisId: string;
  services: Record<string, any>[];
  montantHT: number;
  montantTTC: number;
  createdById: string;
}

export interface DevisVersionOutput {
  id: string;
  devisId: string;
  versionNumber: number;
  services: Record<string, any>[];
  montantHT: number;
  montantTTC: number;
  createdBy: {
    id: string;
    nom: string;
    prenom: string;
  };
  createdAt: Date;
}

/**
 * DevisVersionService - Track all versions of a devis
 * When a devis is modified after being sent to client, create new version
 */
export class DevisVersionService {
  /**
   * Get next version number for a devis
   */
  private async getNextVersionNumber(devisId: string): Promise<number> {
    const lastVersion = await prisma.devisVersion.findFirst({
      where: { devisId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    return (lastVersion?.versionNumber || 0) + 1;
  }

  /**
   * Create new version when devis is modified
   */
  async createVersion(input: DevisVersionInput): Promise<DevisVersionOutput> {
    try {
      // Verify devis exists
      const devis = await prisma.devis.findUnique({
        where: { id: input.devisId },
      });

      if (!devis) {
        throw new AppError('Devis not found', 404);
      }

      // Get next version number
      const versionNumber = await this.getNextVersionNumber(input.devisId);

      // Create version
      const version = await prisma.devisVersion.create({
        data: {
          devisId: input.devisId,
          versionNumber,
          services: input.services,
          montantHT: input.montantHT,
          montantTTC: input.montantTTC,
          createdById: input.createdById,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
      });

      logger.info(`Created devis version: ${input.devisId} v${versionNumber}`);

      return version as DevisVersionOutput;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to create devis version: ${error}`);
      throw new AppError('Failed to create version', 500);
    }
  }

  /**
   * Get all versions of a devis
   */
  async getVersions(devisId: string): Promise<DevisVersionOutput[]> {
    try {
      const versions = await prisma.devisVersion.findMany({
        where: { devisId },
        include: {
          createdBy: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
        orderBy: { versionNumber: 'asc' },
      });

      return versions as DevisVersionOutput[];
    } catch (error) {
      logger.error(`Failed to get versions: ${error}`);
      return [];
    }
  }

  /**
   * Get specific version
   */
  async getVersion(devisId: string, versionNumber: number): Promise<DevisVersionOutput | null> {
    try {
      const version = await prisma.devisVersion.findUnique({
        where: {
          devisId_versionNumber: {
            devisId,
            versionNumber,
          },
        },
        include: {
          createdBy: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
      });

      return version as DevisVersionOutput | null;
    } catch (error) {
      logger.error(`Failed to get version: ${error}`);
      return null;
    }
  }

  /**
   * Get current version (highest version number)
   */
  async getCurrentVersion(devisId: string): Promise<DevisVersionOutput | null> {
    try {
      const version = await prisma.devisVersion.findFirst({
        where: { devisId },
        include: {
          createdBy: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
        orderBy: { versionNumber: 'desc' },
      });

      return version as DevisVersionOutput | null;
    } catch (error) {
      logger.error(`Failed to get current version: ${error}`);
      return null;
    }
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    devisId: string,
    version1: number,
    version2: number
  ): Promise<{ changes: Record<string, any> } | null> {
    try {
      const v1 = await this.getVersion(devisId, version1);
      const v2 = await this.getVersion(devisId, version2);

      if (!v1 || !v2) {
        return null;
      }

      const changes: Record<string, any> = {};

      // Compare services
      if (JSON.stringify(v1.services) !== JSON.stringify(v2.services)) {
        changes.services = {
          old: v1.services,
          new: v2.services,
        };
      }

      // Compare amounts
      if (v1.montantHT.toString() !== v2.montantHT.toString()) {
        changes.montantHT = {
          old: v1.montantHT,
          new: v2.montantHT,
        };
      }

      if (v1.montantTTC.toString() !== v2.montantTTC.toString()) {
        changes.montantTTC = {
          old: v1.montantTTC,
          new: v2.montantTTC,
        };
      }

      return { changes };
    } catch (error) {
      logger.error(`Failed to compare versions: ${error}`);
      return null;
    }
  }

  /**
   * Delete old versions (keep last 10)
   */
  async cleanupOldVersions(devisId: string, keepLast: number = 10): Promise<void> {
    try {
      const versions = await prisma.devisVersion.findMany({
        where: { devisId },
        orderBy: { versionNumber: 'desc' },
        skip: keepLast,
      });

      if (versions.length > 0) {
        await prisma.devisVersion.deleteMany({
          where: {
            id: {
              in: versions.map((v) => v.id),
            },
          },
        });

        logger.info(`Cleaned up ${versions.length} old versions for devis ${devisId}`);
      }
    } catch (error) {
      logger.error(`Failed to cleanup versions: ${error}`);
    }
  }
}

export const devisVersionService = new DevisVersionService();
