import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'GET factures (to be implemented)' });
});

router.post('/', (req: Request, res: Response) => {
  res.status(201).json({ message: 'POST facture (to be implemented)' });
});

router.patch('/:id', (req: Request, res: Response) => {
  res.json({ message: `PATCH facture ${req.params.id}` });
});

router.delete('/:id', (req: Request, res: Response) => {
  res.status(204).send();
});

router.post('/:id/export', (req: Request, res: Response) => {
  res.json({ message: 'Export facture PDF (to be implemented)' });
});

export default router;
