import { Router } from 'express';
import {
  listDiscountRules,
  createDiscountRule,
  updateDiscountRule,
  deleteDiscountRule,
  checkDiscount,
} from '../controllers/discountController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = Router();

router.get('/', listDiscountRules);
router.post('/check', checkDiscount);
router.post('/', authenticate, requireAdmin, createDiscountRule);
router.put('/:id', authenticate, requireAdmin, updateDiscountRule);
router.delete('/:id', authenticate, requireAdmin, deleteDiscountRule);

export default router;
