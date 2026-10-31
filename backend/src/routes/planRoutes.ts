import { Router } from 'express';
import {
  listPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} from '../controllers/planController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = Router();

// Products & plans can be viewed by all users
router.get('/', listPlans);
router.get('/:id', getPlanById);

// Admin only manages plans
router.post('/', authenticate, requireAdmin, createPlan);
router.put('/:id', authenticate, requireAdmin, updatePlan);
router.delete('/:id', authenticate, requireAdmin, deletePlan);

export default router;
