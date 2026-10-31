import { Router } from 'express';
import { triggerBillingRun } from '../controllers/billingController.js';
import { authenticate, requireStaffOrAdmin } from '../middlewares/auth.js';

const router = Router();

// Trigger billing cycle run
router.post('/trigger', authenticate, requireStaffOrAdmin, triggerBillingRun);

export default router;
