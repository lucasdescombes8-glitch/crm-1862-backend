import request from 'supertest';
import express from 'express';
import facturesRouter from '../../routes/factures.routes';
import { PrismaClient } from '@prisma/client';

const mockPrisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use('/api/factures', (req, res, next) => {
  req.user = { userId: 'test-user' };
  next();
});
app.use('/api/factures', facturesRouter);

describe('Factures API Endpoints', () => {
  describe('GET /api/factures', () => {
    it('should return list of factures', async () => {
      const mockFactures = [
        { id: '1', numero: 'FACT-2026-001', statutPaiement: 'impayee' },
      ];

      (mockPrisma.facture.findMany as jest.Mock).mockResolvedValue(mockFactures);
      (mockPrisma.facture.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app).get('/api/factures');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.factures).toEqual(mockFactures);
    });
  });

  describe('GET /api/factures/unpaid', () => {
    it('should return unpaid factures', async () => {
      const mockUnpaid = [
        { id: '1', numero: 'FACT-2026-001', statutPaiement: 'impayee' },
      ];

      (mockPrisma.facture.findMany as jest.Mock).mockResolvedValue(mockUnpaid);

      const response = await request(app).get('/api/factures/unpaid');

      expect(response.status).toBe(200);
      expect(response.body.data[0].statutPaiement).toBe('impayee');
    });
  });

  describe('POST /api/factures/:id/payment', () => {
    it('should record payment', async () => {
      const mockFacture = {
        id: '1',
        statutPaiement: 'partiellement_payee',
        montantRecu: 600,
      };

      (mockPrisma.facture.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        montantTTC: 1200,
        montantRecu: 0,
      });
      (mockPrisma.facture.update as jest.Mock).mockResolvedValue(mockFacture);

      const response = await request(app)
        .post('/api/factures/1/payment')
        .send({ montantRecu: 600 });

      expect(response.status).toBe(200);
      expect(response.body.data.statutPaiement).toBe('partiellement_payee');
    });
  });
});
