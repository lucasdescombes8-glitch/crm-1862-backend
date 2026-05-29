import { Router, Request, Response } from 'express';
import { contactService } from '../services/ContactService';
import { ContactCreateSchema, ContactUpdateSchema } from '../types/validation';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/contacts
 * Get all contacts with pagination and search
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 25;
    const search = req.query.search as string | undefined;

    const result = await contactService.getAllContacts(skip, take, search);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          statusCode: error.statusCode,
          message: error.message,
        },
      });
    }

    logger.error(`Get contacts error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la rÃ©cupÃ©ration des contacts',
      },
    });
  }
});

/**
 * GET /api/contacts/:id
 * Get contact by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const contact = await contactService.getContactById(req.params.id);

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          statusCode: error.statusCode,
          message: error.message,
        },
      });
    }

    logger.error(`Get contact error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la rÃ©cupÃ©ration du contact',
      },
    });
  }
});

/**
 * POST /api/contacts
 * Create new contact
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = ContactCreateSchema.parse(req.body);

    // Create contact
    const contact = await contactService.createContact(validatedData);

    logger.info(`Contact created: ${contact.id}`);

    res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    if (error instanceof Error && 'errors' in error) {
      // Zod validation error
      return res.status(400).json({
        error: {
          statusCode: 400,
          message: 'DonnÃ©es invalides',
          details: (error as any).errors,
        },
      });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          statusCode: error.statusCode,
          message: error.message,
        },
      });
    }

    logger.error(`Create contact error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la crÃ©ation du contact',
      },
    });
  }
});

/**
 * PATCH /api/contacts/:id
 * Update contact
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = ContactUpdateSchema.parse(req.body);

    // Update contact
    const contact = await contactService.updateContact(
      req.params.id,
      validatedData
    );

    logger.info(`Contact updated: ${req.params.id}`);

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    if (error instanceof Error && 'errors' in error) {
      // Zod validation error
      return res.status(400).json({
        error: {
          statusCode: 400,
          message: 'DonnÃ©es invalides',
          details: (error as any).errors,
        },
      });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          statusCode: error.statusCode,
          message: error.message,
        },
      });
    }

    logger.error(`Update contact error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la mise Ã  jour du contact',
      },
    });
  }
});

/**
 * DELETE /api/contacts/:id
 * Delete contact
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await contactService.deleteContact(req.params.id);

    logger.info(`Contact deleted: ${req.params.id}`);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          statusCode: error.statusCode,
          message: error.message,
        },
      });
    }

    logger.error(`Delete contact error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la suppression du contact',
      },
    });
  }
});

/**
 * GET /api/contacts/type/:type
 * Get contacts by type
 */
router.get('/type/:type', async (req: Request, res: Response) => {
  try {
    const contacts = await contactService.getContactsByType(req.params.type);

    res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          statusCode: error.statusCode,
          message: error.message,
        },
      });
    }

    logger.error(`Get contacts by type error: ${error}`);
    res.status(500).json({
      error: {
        statusCode: 500,
        message: 'Erreur lors de la rÃ©cupÃ©ration des contacts',
      },
    });
  }
});

export default router;
