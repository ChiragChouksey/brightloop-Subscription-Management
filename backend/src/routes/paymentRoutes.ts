import { Router } from 'express';
import {
  listPayments,
  createRazorpayOrder,
  verifyRazorpayPayment,
  recordManualPayment,
} from '../controllers/paymentController.js';
import { authenticate, requireStaffOrAdmin } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, listPayments);
router.post('/razorpay/order', authenticate, createRazorpayOrder);
router.post('/razorpay/verify', authenticate, verifyRazorpayPayment);
router.post('/manual', authenticate, requireStaffOrAdmin, recordManualPayment);

export default router;
