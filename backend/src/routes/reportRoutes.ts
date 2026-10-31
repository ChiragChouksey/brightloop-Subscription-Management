import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/reportController.js';
import { authenticate, requireStaffOrAdmin } from '../middlewares/auth.js';

const router = Router();

router.get('/analytics', authenticate, requireStaffOrAdmin, getDashboardAnalytics);

export default router;
