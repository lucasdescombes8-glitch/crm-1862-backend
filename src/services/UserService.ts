import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { LoginInput, RegisterInput } from '../types/validation';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class UserService {
  /**
   * Register new user
   */
  async register(input: RegisterInput) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new AppError('Cet email est dÃ©jÃ  utilisÃ©', 400);
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(input.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          nom: input.nom,
          prenom: input.prenom,
          role: input.role || 'COMMERCIAL',
        },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
        },
      });

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      logger.info(`User registered: ${user.email}`);

      return {
        user,
        token,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Registration error: ${error}`);
      throw new AppError('Erreur lors de l\'enregistrement', 500);
    }
  }

  /**
   * Login user
   */
  async login(input: LoginInput) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new AppError('Email ou mot de passe incorrect', 401);
      }

      // Check password
      const isPasswordValid = await bcryptjs.compare(
        input.password,
        user.password
      );

      if (!isPasswordValid) {
        throw new AppError('Email ou mot de passe incorrect', 401);
      }

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      logger.info(`User logged in: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
        },
        token,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Login error: ${error}`);
      throw new AppError('Erreur lors de la connexion', 500);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          statut: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new AppError('Utilisateur non trouvÃ©', 404);
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Erreur lors de la rÃ©cupÃ©ration de l\'utilisateur', 500);
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers() {
    try {
      const users = await prisma.user.findMany({
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

      return users;
    } catch (error) {
      logger.error(`Get all users error: ${error}`);
      throw new AppError('Erreur lors de la rÃ©cupÃ©ration des utilisateurs', 500);
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: Partial<any>) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(data.nom && { nom: data.nom }),
          ...(data.prenom && { prenom: data.prenom }),
          ...(data.role && { role: data.role }),
          ...(data.statut && { statut: data.statut }),
        },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          statut: true,
        },
      });

      logger.info(`User updated: ${id}`);
      return user;
    } catch (error) {
      logger.error(`Update user error: ${error}`);
      throw new AppError('Erreur lors de la mise Ã  jour de l\'utilisateur', 500);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string) {
    try {
      await prisma.user.delete({
        where: { id },
      });

      logger.info(`User deleted: ${id}`);
      return { message: 'Utilisateur supprimÃ©' };
    } catch (error) {
      logger.error(`Delete user error: ${error}`);
      throw new AppError('Erreur lors de la suppression de l\'utilisateur', 500);
    }
  }
}

export const userService = new UserService();
