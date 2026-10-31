import { Router } from 'express';
import {
  listTemplates,
  createTemplate,
  listQuotations,
  createQuotation,
  convertQuotationToSubscription,
} from '../controllers/quotationController.js';
import { authenticate, requireAdmin, requireStaffOrAdmin } from '../middlewares/auth.js';

const router = Router();

// Templates
router.get('/templates', authenticate, listTemplates);
router.post('/templates', authenticate, requireStaffOrAdmin, createTemplate);

// Quotations
router.get('/', authenticate, listQuotations);
router.post('/', authenticate, createQuotation);
router.post('/:id/convert', authenticate, convertQuotationToSubscription);

export default router;
