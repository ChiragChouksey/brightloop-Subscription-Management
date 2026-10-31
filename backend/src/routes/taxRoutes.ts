import { Router } from 'express';
import {
  listTaxRules,
  createTaxRule,
  updateTaxRule,
  deleteTaxRule,
} from '../controllers/taxController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = Router();

router.get('/', listTaxRules);
router.post('/', authenticate, requireAdmin, createTaxRule);
router.put('/:id', authenticate, requireAdmin, updateTaxRule);
router.delete('/:id', authenticate, requireAdmin, deleteTaxRule);

export default router;
