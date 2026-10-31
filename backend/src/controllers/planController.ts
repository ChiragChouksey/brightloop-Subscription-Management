import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export const listPlans = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { productId, active, billingInterval } = req.query;

    const where: any = {};
    if (productId) where.productId = String(productId);
    if (active !== undefined) where.active = active === 'true';
    if (billingInterval) where.billingInterval = String(billingInterval).toUpperCase();

    const plans = await prisma.plan.findMany({
      where,
      include: {
        product: {
          include: {
            variants: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, plans });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPlanById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            variants: true,
          },
        },
      },
    });

    if (!plan) {
      res.status(404).json({ success: false, message: 'Plan not found.' });
      return;
    }

    res.json({ success: true, plan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      productId,
      price,
      billingInterval,
      minQuantity,
      availableFrom,
      availableUntil,
      autoCloseOnEnd,
      allowEarlyClosure,
      allowPause,
      allowRenewal,
    } = req.body;

    if (!name || !productId || price === undefined) {
      res.status(400).json({ success: false, message: 'Plan name, product, and price are required.' });
      return;
    }

    const validIntervals = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
    const interval = billingInterval ? billingInterval.toUpperCase() : 'MONTHLY';
    if (!validIntervals.includes(interval)) {
      res.status(400).json({
        success: false,
        message: `Invalid billing interval. Allowed: ${validIntervals.join(', ')}`,
      });
      return;
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        productId,
        price: Number(price),
        billingInterval: interval,
        minQuantity: Number(minQuantity || 1),
        availableFrom: availableFrom ? new Date(availableFrom) : new Date(),
        availableUntil: availableUntil ? new Date(availableUntil) : null,
        autoCloseOnEnd: autoCloseOnEnd !== undefined ? Boolean(autoCloseOnEnd) : true,
        allowEarlyClosure: allowEarlyClosure !== undefined ? Boolean(allowEarlyClosure) : true,
        allowPause: allowPause !== undefined ? Boolean(allowPause) : true,
        allowRenewal: allowRenewal !== undefined ? Boolean(allowRenewal) : true,
      },
      include: {
        product: true,
      },
    });

    res.status(201).json({ success: true, message: 'Plan created successfully.', plan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const {
      name,
      price,
      billingInterval,
      minQuantity,
      availableFrom,
      availableUntil,
      autoCloseOnEnd,
      allowEarlyClosure,
      allowPause,
      allowRenewal,
      active,
    } = req.body;

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        price: price !== undefined ? Number(price) : undefined,
        billingInterval: billingInterval ? billingInterval.toUpperCase() : undefined,
        minQuantity: minQuantity !== undefined ? Number(minQuantity) : undefined,
        availableFrom: availableFrom ? new Date(availableFrom) : undefined,
        availableUntil: availableUntil ? new Date(availableUntil) : undefined,
        autoCloseOnEnd: autoCloseOnEnd !== undefined ? Boolean(autoCloseOnEnd) : undefined,
        allowEarlyClosure: allowEarlyClosure !== undefined ? Boolean(allowEarlyClosure) : undefined,
        allowPause: allowPause !== undefined ? Boolean(allowPause) : undefined,
        allowRenewal: allowRenewal !== undefined ? Boolean(allowRenewal) : undefined,
        active: active !== undefined ? Boolean(active) : undefined,
      },
      include: {
        product: true,
      },
    });

    res.json({ success: true, message: 'Plan updated successfully.', plan: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const subCount = await prisma.subscription.count({ where: { planId: id } });
    if (subCount > 0) {
      await prisma.plan.update({
        where: { id },
        data: { active: false },
      });
      res.json({
        success: true,
        message: 'Plan has associated subscriptions. It was safely deactivated.',
      });
      return;
    }

    await prisma.plan.delete({ where: { id } });
    res.json({ success: true, message: 'Plan deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
