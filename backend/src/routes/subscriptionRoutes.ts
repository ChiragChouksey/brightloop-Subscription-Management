import { Router } from 'express';
import {
  listSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscriptionStatus,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
  closeSubscriptionEarly,
} from '../controllers/subscriptionController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, listSubscriptions);
router.get('/:id', authenticate, getSubscriptionById);
router.post('/', authenticate, createSubscription);
router.patch('/:id/status', authenticate, updateSubscriptionStatus);
router.post('/:id/pause', authenticate, pauseSubscription);
router.post('/:id/resume', authenticate, resumeSubscription);
router.post('/:id/renew', authenticate, renewSubscription);
router.post('/:id/close', authenticate, closeSubscriptionEarly);

export default router;
