import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'GET devis (to be implemented)' });
});

router.post('/', (req: Request, res: Response) => {
  res.status(201).json({ message: 'POST devis (to be implemented)' });
});

router.patch('/:id', (req: Request, res: Response) => {
  res.json({ message: `PATCH devis ${req.params.id}` });
});

router.delete('/:id', (req: Request, res: Response) => {
  res.status(204).send();
});

router.get('/:id/versions', (req: Request, res: Response) => {
  res.json({ message: 'GET devis versions (to be implemented)' });
});

router.post('/:id/export', (req: Request, res: Response) => {
  res.json({ message: 'Export devis PDF (to be implemented)' });
});

export default router;
