import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface AuditLogEntry {
  entityType: string;
  entityId: string;
  userId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  changes?: Record<string, { old: any; new: any }>;
}

export interface AuditHistoryItem {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  changes?: Record<string, { old: any; new: any }>;
  createdAt: Date;
}

/**
 * AuditLogService - Track all changes to entities
 * Logs INSERT, UPDATE, DELETE operations with full change details
 */
export class AuditLogService {
  /**
   * Log an action to audit trail
   */
  async logAction(input: AuditLogEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          entityType: input.entityType,
          entityId: input.entityId,
          userId: input.userId,
          action: input.action,
          changes: input.changes || {},
        },
      });

      logger.info(`Audit: ${input.action} ${input.entityType} ${input.entityId}`);
    } catch (error) {
      logger.error(`Failed to log audit: ${error}`);
      // Don't throw - audit logging shouldn't break main operation
    }
  }

  /**
   * Get history for an entity
   */
  async getHistory(entityType: string, entityId: string): Promise<AuditHistoryItem[]> {
    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          entityType,
          entityId,
        },
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return logs as AuditHistoryItem[];
    } catch (error) {
      logger.error(`Failed to get history: ${error}`);
      return [];
    }
  }

  /**
   * Get all events history for a specific event
   */
  async getEvenementHistory(evenementId: string): Promise<AuditHistoryItem[]> {
    return this.getHistory('EVENEMENT', evenementId);
  }

  /**
   * Get all devis history for a specific devis
   */
  async getDevisHistory(devisId: string): Promise<AuditHistoryItem[]> {
    return this.getHistory('DEVIS', devisId);
  }

  /**
   * Get all facture history for a specific facture
   */
  async getFactureHistory(factureId: string): Promise<AuditHistoryItem[]> {
    return this.getHistory('FACTURE', factureId);
  }

  /**
   * Get recent audit logs (for admin dashboard)
   */
  async getRecentLogs(limit: number = 50): Promise<AuditHistoryItem[]> {
    try {
      const logs = await prisma.auditLog.findMany({
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return logs as AuditHistoryItem[];
    } catch (error) {
      logger.error(`Failed to get recent logs: ${error}`);
      return [];
    }
  }

  /**
   * Calculate differences between old and new values
   */
  static calculateChanges(oldValues: Record<string, any>, newValues: Record<string, any>): Record<string, any> {
    const changes: Record<string, any> = {};

    // Check for updated fields
    for (const key in newValues) {
      if (oldValues[key] !== newValues[key]) {
        changes[key] = {
          old: oldValues[key],
          new: newValues[key],
        };
      }
    }

    return changes;
  }

  /**
   * Format changes for display in UI
   */
  static formatChanges(changes: Record<string, any>): string[] {
    return Object.entries(changes).map(([field, change]) => {
      const oldVal = JSON.stringify(change.old).substring(0, 50);
      const newVal = JSON.stringify(change.new).substring(0, 50);
      return `${field}: "${oldVal}" â†’ "${newVal}"`;
    });
  }
}

export const auditLogService = new AuditLogService();
