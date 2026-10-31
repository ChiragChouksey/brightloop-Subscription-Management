import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export const listSubscriptions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, customerId, search } = req.query;

    const where: any = {};

    // Customer isolation
    if (req.user?.role === 'CUSTOMER') {
      where.customerId = req.user.userId;
    } else if (customerId) {
      where.customerId = String(customerId);
    }

    if (status) {
      where.status = String(status).toUpperCase();
    }

    if (search) {
      where.OR = [
        { subscriptionNumber: { contains: String(search) } },
        { customer: { name: { contains: String(search) } } },
        { customer: { email: { contains: String(search) } } },
      ];
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, companyName: true, phone: true } },
        plan: { include: { product: true } },
        lines: { include: { product: true } },
        _count: { select: { invoices: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, subscriptions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubscriptionById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, companyName: true, phone: true } },
        plan: { include: { product: true } },
        lines: { include: { product: true } },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: { payments: true },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found.' });
      return;
    }

    // Role security: customer can only see own subscription
    if (req.user?.role === 'CUSTOMER' && subscription.customerId !== req.user.userId) {
      res.status(403).json({ success: false, message: 'Access denied to this subscription.' });
      return;
    }

    res.json({ success: true, subscription });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      customerId,
      planId,
      startDate,
      expiryDate,
      paymentTerms,
      quantity,
      discountCode,
      status: initialStatus,
    } = req.body;

    const targetCustomerId = req.user?.role === 'CUSTOMER' ? req.user.userId : customerId;
    if (!targetCustomerId || !planId) {
      res.status(400).json({ success: false, message: 'Customer ID and Plan ID are required.' });
      return;
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { product: true },
    });

    if (!plan || !plan.active) {
      res.status(400).json({ success: false, message: 'Selected plan is inactive or not found.' });
      return;
    }

    const subCount = await prisma.subscription.count();
    const subscriptionNumber = `SUB-${new Date().getFullYear()}-${String(subCount + 1).padStart(4, '0')}`;

    const effectiveQty = Number(quantity || plan.minQuantity || 1);
    const unitPrice = plan.price;
    const subtotal = effectiveQty * unitPrice;
    const taxRate = 18; // 18% GST
    const taxAmount = (subtotal * taxRate) / 100;

    let discountAmount = 0;
    if (discountCode) {
      const discount = await prisma.discountRule.findUnique({ where: { code: discountCode.toUpperCase() } });
      if (discount && discount.active) {
        if (discount.discountType === 'PERCENTAGE') {
          discountAmount = (subtotal * discount.value) / 100;
        } else {
          discountAmount = Math.min(discount.value, subtotal);
        }
      }
    }

    const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);
    const start = startDate ? new Date(startDate) : new Date();

    const nextBillingDate = new Date(start);
    if (plan.billingInterval === 'DAILY') nextBillingDate.setDate(nextBillingDate.getDate() + 1);
    else if (plan.billingInterval === 'WEEKLY') nextBillingDate.setDate(nextBillingDate.getDate() + 7);
    else if (plan.billingInterval === 'YEARLY') nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    else nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const expiry = expiryDate
      ? new Date(expiryDate)
      : new Date(new Date(start).setFullYear(start.getFullYear() + 1));

    const statusToSet = initialStatus ? initialStatus.toUpperCase() : 'ACTIVE';

    const subscription = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId: targetCustomerId,
          planId,
          status: statusToSet,
          billingInterval: plan.billingInterval,
          startDate: start,
          expiryDate: expiry,
          nextBillingDate,
          paymentTerms: paymentTerms || 'Immediate',
          autoCloseOnEnd: plan.autoCloseOnEnd,
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          lines: {
            create: [
              {
                productId: plan.productId,
                description: `${plan.name} (${plan.billingInterval})`,
                quantity: effectiveQty,
                unitPrice,
                taxRate,
                total: totalAmount,
              },
            ],
          },
          history: {
            create: {
              fromStatus: null,
              toStatus: statusToSet,
              action: 'CREATED',
              notes: `Subscription initialized with status ${statusToSet}`,
              performedBy: req.user?.role || 'SYSTEM',
            },
          },
        },
        include: {
          lines: true,
        },
      });

      // If active, generate initial invoice
      if (statusToSet === 'ACTIVE') {
        const invCount = await tx.invoice.count();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invCount + 1).padStart(4, '0')}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15);

        await tx.invoice.create({
          data: {
            invoiceNumber,
            subscriptionId: sub.id,
            customerId: targetCustomerId,
            billingDate: start,
            dueDate,
            subtotal,
            taxAmount,
            discountAmount,
            totalAmount,
            status: 'CONFIRMED',
            lines: {
              create: [
                {
                  productId: plan.productId,
                  description: `${plan.name} (${plan.billingInterval})`,
                  quantity: effectiveQty,
                  unitPrice,
                  taxRate,
                  total: totalAmount,
                },
              ],
            },
          },
        });
      }

      return sub;
    });

    res.status(201).json({ success: true, message: 'Subscription created successfully.', subscription });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE SUBSCRIPTION STATUS (Workflow: Draft -> Quotation -> Confirmed -> Active -> Closed)
export const updateSubscriptionStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, notes } = req.body;

    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription not found.' });
      return;
    }

    const newStatus = status.toUpperCase();
    const oldStatus = sub.status;

    // Permissions check
    if (req.user?.role === 'CUSTOMER') {
      res.status(403).json({ success: false, message: 'Customers cannot change subscription status directly.' });
      return;
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: newStatus,
        closedAt: newStatus === 'CLOSED' ? new Date() : undefined,
        history: {
          create: {
            fromStatus: oldStatus,
            toStatus: newStatus,
            action: `STATUS_CHANGE_TO_${newStatus}`,
            notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
            performedBy: req.user?.role || 'SYSTEM',
          },
        },
      },
    });

    res.json({ success: true, message: `Status updated to ${newStatus}.`, subscription: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PAUSE SUBSCRIPTION (Check plan permission: allowPause)
export const pauseSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;

    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription not found.' });
      return;
    }

    if (sub.status !== 'ACTIVE') {
      res.status(400).json({ success: false, message: 'Only active subscriptions can be paused.' });
      return;
    }

    if (!sub.plan.allowPause) {
      res.status(400).json({ success: false, message: 'This plan configuration does not allow pausing.' });
      return;
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(),
        history: {
          create: {
            fromStatus: 'ACTIVE',
            toStatus: 'PAUSED',
            action: 'PAUSED',
            notes: reason || 'Subscription paused by user/admin',
            performedBy: req.user?.role || 'SYSTEM',
          },
        },
      },
    });

    res.json({ success: true, message: 'Subscription has been paused.', subscription: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// RESUME SUBSCRIPTION
export const resumeSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const sub = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription not found.' });
      return;
    }

    if (sub.status !== 'PAUSED') {
      res.status(400).json({ success: false, message: 'Subscription is not currently paused.' });
      return;
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
        history: {
          create: {
            fromStatus: 'PAUSED',
            toStatus: 'ACTIVE',
            action: 'RESUMED',
            notes: 'Subscription resumed to active status',
            performedBy: req.user?.role || 'SYSTEM',
          },
        },
      },
    });

    res.json({ success: true, message: 'Subscription resumed successfully.', subscription: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// RENEW SUBSCRIPTION (Check plan permission: allowRenewal)
export const renewSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription not found.' });
      return;
    }

    if (!sub.plan.allowRenewal) {
      res.status(400).json({ success: false, message: 'This plan does not permit renewal.' });
      return;
    }

    const currentExpiry = sub.expiryDate ? new Date(sub.expiryDate) : new Date();
    const newExpiry = new Date(currentExpiry);

    if (sub.billingInterval === 'DAILY') newExpiry.setDate(newExpiry.getDate() + 30);
    else if (sub.billingInterval === 'WEEKLY') newExpiry.setDate(newExpiry.getDate() + 12 * 7);
    else if (sub.billingInterval === 'YEARLY') newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    else newExpiry.setMonth(newExpiry.getMonth() + 12);

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        expiryDate: newExpiry,
        history: {
          create: {
            fromStatus: sub.status,
            toStatus: 'ACTIVE',
            action: 'RENEWED',
            notes: `Subscription renewed until ${newExpiry.toISOString().split('T')[0]}`,
            performedBy: req.user?.role || 'SYSTEM',
          },
        },
      },
    });

    res.json({ success: true, message: 'Subscription renewed successfully.', subscription: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// EARLY CLOSURE (Check plan permission: allowEarlyClosure)
export const closeSubscriptionEarly = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;

    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!sub) {
      res.status(404).json({ success: false, message: 'Subscription not found.' });
      return;
    }

    if (!sub.plan.allowEarlyClosure && req.user?.role !== 'ADMIN') {
      res.status(400).json({
        success: false,
        message: 'This plan does not permit early closure without admin intervention.',
      });
      return;
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        cancellationReason: reason || 'Early closure requested',
        history: {
          create: {
            fromStatus: sub.status,
            toStatus: 'CLOSED',
            action: 'EARLY_CLOSURE',
            notes: reason || 'Early closure executed',
            performedBy: req.user?.role || 'SYSTEM',
          },
        },
      },
    });

    res.json({ success: true, message: 'Subscription closed early.', subscription: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
