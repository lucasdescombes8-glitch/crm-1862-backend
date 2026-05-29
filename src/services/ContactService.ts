import { PrismaClient } from '@prisma/client';
import { ContactCreateInput, ContactUpdateInput } from '../types/validation';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class ContactService {
  /**
   * Get all contacts with pagination
   */
  async getAllContacts(skip: number = 0, take: number = 25, search?: string) {
    try {
      const where = search
        ? {
            OR: [
              { nom: { contains: search, mode: 'insensitive' as any } },
              { prenom: { contains: search, mode: 'insensitive' as any } },
              { email: { contains: search, mode: 'insensitive' as any } },
              { entreprise: { contains: search, mode: 'insensitive' as any } },
            ],
          }
        : {};

      const [contacts, total] = await Promise.all([
        prisma.contact.findMany({
          where,
          skip,
          take,
          include: {
            interactions: {
              take: 3,
              orderBy: { dateInteraction: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.contact.count({ where }),
      ]);

      return {
        contacts,
        pagination: {
          skip,
          take,
          total,
          pages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      logger.error(`Get contacts error: ${error}`);
      throw new AppError('Erreur lors de la rÃ©cupÃ©ration des contacts', 500);
    }
  }

  /**
   * Get contact by ID
   */
  async getContactById(id: string) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id },
        include: {
          interactions: {
            orderBy: { dateInteraction: 'desc' },
          },
          evenements: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!contact) {
        throw new AppError('Contact non trouvÃ©', 404);
      }

      return contact;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Get contact error: ${error}`);
      throw new AppError('Erreur lors de la rÃ©cupÃ©ration du contact', 500);
    }
  }

  /**
   * Create contact
   */
  async createContact(input: ContactCreateInput) {
    try {
      // Check if email already exists
      if (input.email) {
        const existingContact = await prisma.contact.findUnique({
          where: { email: input.email },
        });

        if (existingContact) {
          throw new AppError('Cet email est dÃ©jÃ  utilisÃ©', 400);
        }
      }

      const contact = await prisma.contact.create({
        data: {
          nom: input.nom,
          prenom: input.prenom,
          email: input.email || null,
          telephone: input.telephone || null,
          entreprise: input.entreprise || null,
          type: input.type,
          statut: input.statut || 'actif',
          notes: input.notes || null,
        },
      });

      logger.info(`Contact created: ${contact.id}`);
      return contact;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Create contact error: ${error}`);
      throw new AppError('Erreur lors de la crÃ©ation du contact', 500);
    }
  }

  /**
   * Update contact
   */
  async updateContact(id: string, input: ContactUpdateInput) {
    try {
      // Verify contact exists
      const contact = await prisma.contact.findUnique({
        where: { id },
      });

      if (!contact) {
        throw new AppError('Contact non trouvÃ©', 404);
      }

      // Check email uniqueness if updating
      if (input.email && input.email !== contact.email) {
        const existingContact = await prisma.contact.findUnique({
          where: { email: input.email },
        });

        if (existingContact) {
          throw new AppError('Cet email est dÃ©jÃ  utilisÃ©', 400);
        }
      }

      const updated = await prisma.contact.update({
        where: { id },
        data: {
          ...(input.nom && { nom: input.nom }),
          ...(input.prenom && { prenom: input.prenom }),
          ...(input.email && { email: input.email }),
          ...(input.telephone && { telephone: input.telephone }),
          ...(input.entreprise && { entreprise: input.entreprise }),
          ...(input.type && { type: input.type }),
          ...(input.statut && { statut: input.statut }),
          ...(input.notes !== undefined && { notes: input.notes }),
        },
      });

      logger.info(`Contact updated: ${id}`);
      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Update contact error: ${error}`);
      throw new AppError('Erreur lors de la mise Ã  jour du contact', 500);
    }
  }

  /**
   * Delete contact
   */
  async deleteContact(id: string) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id },
      });

      if (!contact) {
        throw new AppError('Contact non trouvÃ©', 404);
      }

      await prisma.contact.delete({
        where: { id },
      });

      logger.info(`Contact deleted: ${id}`);
      return { message: 'Contact supprimÃ©' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Delete contact error: ${error}`);
      throw new AppError('Erreur lors de la suppression du contact', 500);
    }
  }

  /**
   * Get contacts by type
   */
  async getContactsByType(type: string) {
    try {
      const contacts = await prisma.contact.findMany({
        where: { type },
        orderBy: { createdAt: 'desc' },
      });

      return contacts;
    } catch (error) {
      logger.error(`Get contacts by type error: ${error}`);
      throw new AppError('Erreur lors de la rÃ©cupÃ©ration des contacts', 500);
    }
  }

  /**
   * Get contacts by status
   */
  async getContactsByStatus(statut: string) {
    try {
      const contacts = await prisma.contact.findMany({
        where: { statut },
        orderBy: { createdAt: 'desc' },
      });

      return contacts;
    } catch (error) {
      logger.error(`Get contacts by status error: ${error}`);
      throw new AppError('Erreur lors de la rÃ©cupÃ©ration des contacts', 500);
    }
  }
}

export const contactService = new ContactService();
