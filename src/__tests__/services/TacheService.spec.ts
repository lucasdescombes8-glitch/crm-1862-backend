import { TacheService } from '../../services/TacheService';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';

const mockPrisma = new PrismaClient();
const tacheService = new TacheService();

describe('TacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return list of taches with pagination', async () => {
      const mockTaches = [
        { id: '1', titre: 'Setup', statut: 'a_faire' },
        { id: '2', titre: 'Deploy', statut: 'en_cours' },
      ];

      (mockPrisma.tache.findMany as jest.Mock).mockResolvedValue(mockTaches);
      (mockPrisma.tache.count as jest.Mock).mockResolvedValue(2);

      const result = await tacheService.getAll(0, 25, {});

      expect(result.taches).toEqual(mockTaches);
    });

    it('should filter by statut', async () => {
      const mockTaches = [{ id: '1', titre: 'Setup', statut: 'terminee' }];

      (mockPrisma.tache.findMany as jest.Mock).mockResolvedValue(mockTaches);
      (mockPrisma.tache.count as jest.Mock).mockResolvedValue(1);

      const result = await tacheService.getAll(0, 25, { statut: 'terminee' });

      expect(result.taches[0].statut).toBe('terminee');
    });
  });

  describe('getKanban', () => {
    it('should return taches grouped by status', async () => {
      const mockTaches = [
        { id: '1', titre: 'Setup', statut: 'a_faire' },
        { id: '2', titre: 'Deploy', statut: 'en_cours' },
        { id: '3', titre: 'Monitor', statut: 'terminee' },
      ];

      (mockPrisma.tache.findMany as jest.Mock).mockResolvedValue(mockTaches);

      const result = await tacheService.getKanban('event-1');

      expect(result.a_faire).toHaveLength(1);
      expect(result.en_cours).toHaveLength(1);
      expect(result.terminee).toHaveLength(1);
    });
  });

  describe('changeStatus', () => {
    it('should change tache status', async () => {
      const mockTache = { id: '1', statut: 'en_cours' };

      (mockPrisma.tache.update as jest.Mock).mockResolvedValue(mockTache);

      const result = await tacheService.changeStatus('1', 'en_cours');

      expect(result.statut).toBe('en_cours');
    });
  });
});
