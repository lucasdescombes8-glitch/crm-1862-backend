import { FactureService } from '../../services/FactureService';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';

jest.mock('../../services/AuditLogService');

const mockPrisma = new PrismaClient();
const factureService = new FactureService();

describe('FactureService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return list of factures with pagination', async () => {
      const mockFactures = [
        { id: '1', numero: 'FACT-2026-001', statutPaiement: 'impayee' },
        { id: '2', numero: 'FACT-2026-002', statutPaiement: 'payee' },
      ];

      (mockPrisma.facture.findMany as jest.Mock).mockResolvedValue(mockFactures);
      (mockPrisma.facture.count as jest.Mock).mockResolvedValue(2);

      const result = await factureService.getAll(0, 25, {});

      expect(result.factures).toEqual(mockFactures);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe('getUnpaid', () => {
    it('should return only unpaid factures', async () => {
      const mockFactures = [
        { id: '1', numero: 'FACT-2026-001', statutPaiement: 'impayee' },
      ];

      (mockPrisma.facture.findMany as jest.Mock).mockResolvedValue(mockFactures);

      const result = await factureService.getUnpaid();

      expect(result[0].statutPaiement).toBe('impayee');
    });
  });

  describe('recordPayment', () => {
    it('should record payment and update status', async () => {
      const mockFacture = {
        id: '1',
        montantTTC: 1200,
        montantRecu: 600,
        statutPaiement: 'partiellement_payee',
      };

      (mockPrisma.facture.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        montantTTC: 1200,
        montantRecu: 0,
      });
      (mockPrisma.facture.update as jest.Mock).mockResolvedValue(mockFacture);

      const result = await factureService.recordPayment('1', 600, 'user-1');

      expect(result.statutPaiement).toBe('partiellement_payee');
    });

    it('should mark facture as paid when full amount received', async () => {
      const mockFacture = {
        id: '1',
        montantTTC: 1200,
        montantRecu: 1200,
        statutPaiement: 'payee',
      };

      (mockPrisma.facture.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        montantTTC: 1200,
        montantRecu: 600,
      });
      (mockPrisma.facture.update as jest.Mock).mockResolvedValue(mockFacture);

      const result = await factureService.recordPayment('1', 600, 'user-1');

      expect(result.statutPaiement).toBe('payee');
    });
  });
});
