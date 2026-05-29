import request from 'supertest';
import express from 'express';
import tachesRouter from '../../routes/taches.routes';
import { PrismaClient } from '@prisma/client';

const mockPrisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use('/api/taches', (req, res, next) => {
  req.user = { userId: 'test-user' };
  next();
});
app.use('/api/taches', tachesRouter);

describe('Taches API Endpoints', () => {
  describe('GET /api/taches', () => {
    it('should return list of taches', async () => {
      const mockTaches = [
        { id: '1', titre: 'Setup', statut: 'a_faire' },
      ];

      (mockPrisma.tache.findMany as jest.Mock).mockResolvedValue(mockTaches);
      (mockPrisma.tache.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app).get('/api/taches');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/taches/kanban/:evenementId', () => {
    it('should return kanban board with taches grouped by status', async () => {
      const mockTaches = [
        { id: '1', titre: 'Setup', statut: 'a_faire' },
        { id: '2', titre: 'Deploy', statut: 'en_cours' },
      ];

      (mockPrisma.tache.findMany as jest.Mock).mockResolvedValue(mockTaches);

      const response = await request(app).get('/api/taches/kanban/event-1');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('a_faire');
      expect(response.body.data).toHaveProperty('en_cours');
      expect(response.body.data).toHaveProperty('terminee');
    });
  });

  describe('POST /api/taches/:id/status', () => {
    it('should change tache status', async () => {
      const mockTache = { id: '1', statut: 'en_cours' };

      (mockPrisma.tache.update as jest.Mock).mockResolvedValue(mockTache);

      const response = await request(app)
        .post('/api/taches/1/status')
        .send({ statut: 'en_cours' });

      expect(response.status).toBe(200);
      expect(response.body.data.statut).toBe('en_cours');
    });
  });
});
