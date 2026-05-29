import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'GET taches (to be implemented)' });
});

router.post('/', (req: Request, res: Response) => {
  res.status(201).json({ message: 'POST tache (to be implemented)' });
});

router.patch('/:id', (req: Request, res: Response) => {
  res.json({ message: `PATCH tache ${req.params.id}` });
});

router.delete('/:id', (req: Request, res: Response) => {
  res.status(204).send();
});

router.patch('/:id/move', (req: Request, res: Response) => {
  res.json({ message: `Move tache ${req.params.id} to column` });
});

export default router;
