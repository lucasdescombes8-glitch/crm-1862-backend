import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'GET options (to be implemented)' });
});

router.post('/', (req: Request, res: Response) => {
  res.status(201).json({ message: 'POST option (to be implemented)' });
});

router.patch('/:id', (req: Request, res: Response) => {
  res.json({ message: `PATCH option ${req.params.id}` });
});

router.delete('/:id', (req: Request, res: Response) => {
  res.status(204).send();
});

export default router;
