import request from 'supertest';
import express from 'express';
import devisRouter from '../../routes/devis.routes';
import { PrismaClient } from '@prisma/client';

const mockPrisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use('/api/devis', (req, res, next) => {
  req.user = { userId: 'test-user' };
  next();
});
app.use('/api/devis', devisRouter);

describe('Devis API Endpoints', () => {
  describe('GET /api/devis', () => {
    it('should return list of devis with pagination', async () => {
      const mockDevis = [
        { id: '1', numero: 'DEV-2026-001', statut: 'brouillon' },
      ];

      (mockPrisma.devis.findMany as jest.Mock).mockResolvedValue(mockDevis);
      (mockPrisma.devis.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/devis')
        .query({ skip: 0, take: 25 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.devis).toEqual(mockDevis);
    });

    it('should filter by statut', async () => {
      const mockDevis = [{ id: '1', numero: 'DEV-2026-001', statut: 'envoye' }];

      (mockPrisma.devis.findMany as jest.Mock).mockResolvedValue(mockDevis);
      (mockPrisma.devis.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/devis')
        .query({ statut: 'envoye' });

      expect(response.status).toBe(200);
      expect(response.body.data.devis[0].statut).toBe('envoye');
    });
  });

  describe('GET /api/devis/:id', () => {
    it('should return devis by id', async () => {
      const mockDevis = { id: '1', numero: 'DEV-2026-001', statut: 'brouillon' };

      (mockPrisma.devis.findUnique as jest.Mock).mockResolvedValue(mockDevis);

      const response = await request(app).get('/api/devis/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockDevis);
    });

    it('should return 404 if devis not found', async () => {
      (mockPrisma.devis.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/devis/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/devis/:id/send', () => {
    it('should send devis to client', async () => {
      const mockDevis = { id: '1', statut: 'envoye' };

      (mockPrisma.devis.findUnique as jest.Mock).mockResolvedValue({ id: '1', statut: 'brouillon' });
      (mockPrisma.devis.update as jest.Mock).mockResolvedValue(mockDevis);

      const response = await request(app).post('/api/devis/1/send');

      expect(response.status).toBe(200);
      expect(response.body.data.statut).toBe('envoye');
    });
  });
});
