import { Router } from 'express';
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductVariant,
} from '../controllers/productController.js';
import { authenticate, requireAdmin, requireStaffOrAdmin } from '../middlewares/auth.js';

const router = Router();

// Everyone can view products (Admin, Staff, Customer)
router.get('/', listProducts);
router.get('/:id', getProductById);

// Admin only can add, edit, or delete products and add variants
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);
router.post('/:id/variants', authenticate, requireAdmin, addProductVariant);

export default router;
