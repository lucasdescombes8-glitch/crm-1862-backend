import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/evenements
router.get('/', async (req: Request, res: Response) => {
  res.json({ message: 'GET evenements (to be implemented)' });
});

// POST /api/evenements
router.post('/', async (req: Request, res: Response) => {
  res.status(201).json({ message: 'POST evenement (to be implemented)' });
});

// PATCH /api/evenements/:id
router.patch('/:id', async (req: Request, res: Response) => {
  res.json({ message: `PATCH evenement ${req.params.id}` });
});

// DELETE /api/evenements/:id
router.delete('/:id', async (req: Request, res: Response) => {
  res.status(204).send();
});

export default router;
