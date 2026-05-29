import { DevisService } from '../../services/DevisService';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';

jest.mock('../../services/DevisVersionService');
jest.mock('../../services/AuditLogService');

const mockPrisma = new PrismaClient();
const devisService = new DevisService();

describe('DevisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return list of devis with pagination', async () => {
      const mockDevis = [
        { id: '1', numero: 'DEV-2026-001', statut: 'brouillon' },
        { id: '2', numero: 'DEV-2026-002', statut: 'envoye' },
      ];

      (mockPrisma.devis.findMany as jest.Mock).mockResolvedValue(mockDevis);
      (mockPrisma.devis.count as jest.Mock).mockResolvedValue(2);

      const result = await devisService.getAll(0, 25, {});

      expect(result.devis).toEqual(mockDevis);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by statut', async () => {
      const mockDevis = [{ id: '1', numero: 'DEV-2026-001', statut: 'envoye' }];

      (mockPrisma.devis.findMany as jest.Mock).mockResolvedValue(mockDevis);
      (mockPrisma.devis.count as jest.Mock).mockResolvedValue(1);

      const result = await devisService.getAll(0, 25, { statut: 'envoye' });

      expect(result.devis[0].statut).toBe('envoye');
    });
  });

  describe('getById', () => {
    it('should return devis by id', async () => {
      const mockDevis = { id: '1', numero: 'DEV-2026-001', statut: 'brouillon' };

      (mockPrisma.devis.findUnique as jest.Mock).mockResolvedValue(mockDevis);

      const result = await devisService.getById('1');

      expect(result.id).toBe('1');
      expect(result.numero).toBe('DEV-2026-001');
    });

    it('should throw error if devis not found', async () => {
      (mockPrisma.devis.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(devisService.getById('nonexistent')).rejects.toThrow(AppError);
    });
  });

  describe('create', () => {
    it('should create devis with auto-generated numero', async () => {
      const mockDevis = {
        id: '1',
        numero: 'DEV-2026-001',
        statut: 'brouillon',
        optionId: 'opt-1',
      };

      (mockPrisma.devis.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.devis.create as jest.Mock).mockResolvedValue(mockDevis);

      const input = {
        optionId: 'opt-1',
        services: [],
        montantHT: 1000,
        montantTTC: 1200,
      };

      const result = await devisService.create(input, 'user-1');

      expect(result.numero).toMatch(/DEV-2026-\d{3}/);
      expect(result.statut).toBe('brouillon');
    });
  });

  describe('send', () => {
    it('should change devis status to envoye', async () => {
      const mockDevis = { id: '1', statut: 'envoye' };

      (mockPrisma.devis.findUnique as jest.Mock).mockResolvedValue({ id: '1', statut: 'brouillon' });
      (mockPrisma.devis.update as jest.Mock).mockResolvedValue(mockDevis);

      const result = await devisService.send('1', 'user-1');

      expect(result.statut).toBe('envoye');
    });
  });
});
