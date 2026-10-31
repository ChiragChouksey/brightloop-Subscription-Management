import { Router } from 'express';
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  createStaff,
  listUsers,
} from '../controllers/authController.js';
import { authenticate, requireAdmin, requireStaffOrAdmin } from '../middlewares/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);

// Admin-only route to create staff accounts (as required by PDF)
router.post('/staff', authenticate, requireAdmin, createStaff);

// User listings (Staff/Admin)
router.get('/users', authenticate, requireStaffOrAdmin, listUsers);

export default router;
