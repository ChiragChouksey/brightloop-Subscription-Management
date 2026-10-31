import { Router } from 'express';
import {
  listInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  sendInvoice,
} from '../controllers/invoiceController.js';
import { authenticate, requireStaffOrAdmin } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, listInvoices);
router.get('/:id', authenticate, getInvoiceById);
router.patch('/:id/status', authenticate, requireStaffOrAdmin, updateInvoiceStatus);
router.post('/:id/send', authenticate, requireStaffOrAdmin, sendInvoice);

export default router;
