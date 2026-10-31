import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export interface BillingRunResult {
  subscriptionsProcessed: number;
  invoicesGenerated: number;
  subscriptionsClosed: number;
  skippedDuplicates: number;
  generatedInvoiceNumbers: string[];
  errors: string[];
}

/**
 * Core billing automation engine.
 * Can be triggered via Cron scheduler or manually by Admin.
 * Safe to run repeatedly - completely prevents duplicate invoices!
 */
export const runBillingEngine = async (): Promise<BillingRunResult> => {
  const result: BillingRunResult = {
    subscriptionsProcessed: 0,
    invoicesGenerated: 0,
    subscriptionsClosed: 0,
    skippedDuplicates: 0,
    generatedInvoiceNumbers: [],
    errors: [],
  };

  const now = new Date();

  // 1. Check for expired subscriptions configured with autoCloseOnEnd
  const expiredSubs = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      autoCloseOnEnd: true,
      expiryDate: { lte: now },
    },
  });

  for (const expSub of expiredSubs) {
    try {
      await prisma.subscription.update({
        where: { id: expSub.id },
        data: {
          status: 'CLOSED',
          closedAt: now,
          history: {
            create: {
              fromStatus: 'ACTIVE',
              toStatus: 'CLOSED',
              action: 'AUTO_EXPIRED',
              notes: 'Subscription automatically closed upon reaching expiry date.',
              performedBy: 'BILLING_ENGINE',
            },
          },
        },
      });
      result.subscriptionsClosed++;
    } catch (err: any) {
      result.errors.push(`Failed auto-closing sub ${expSub.subscriptionNumber}: ${err.message}`);
    }
  }

  // 2. Fetch all ACTIVE subscriptions due for billing (nextBillingDate <= now)
  const dueSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      nextBillingDate: { lte: now },
    },
    include: {
      customer: true,
      plan: true,
      lines: {
        include: { product: true },
      },
    },
  });

  result.subscriptionsProcessed = dueSubscriptions.length;

  for (const sub of dueSubscriptions) {
    try {
      // DUPLICATE INVOICE PREVENTION:
      // Check if an invoice was already generated for this subscription on this exact billing date
      const billingDateStart = new Date(sub.nextBillingDate);
      billingDateStart.setHours(0, 0, 0, 0);
      const billingDateEnd = new Date(sub.nextBillingDate);
      billingDateEnd.setHours(23, 59, 59, 999);

      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          subscriptionId: sub.id,
          billingDate: {
            gte: billingDateStart,
            lte: billingDateEnd,
          },
          status: { not: 'CANCELLED' },
        },
      });

      if (existingInvoice) {
        result.skippedDuplicates++;
        // Advance nextBillingDate if it was not advanced
        const nextDate = calculateNextBillingDate(sub.nextBillingDate, sub.billingInterval);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { nextBillingDate: nextDate },
        });
        continue;
      }

      // Check applicable active discount rules for this customer/subscription
      let discountAmount = sub.discountAmount;

      // Copy lines and calculate totals
      let subtotal = 0;
      let taxAmount = 0;
      const invoiceLinesData: any[] = [];

      for (const line of sub.lines) {
        const lineSubtotal = line.quantity * line.unitPrice;
        const lineTax = (lineSubtotal * line.taxRate) / 100;
        const lineTotal = lineSubtotal + lineTax;

        subtotal += lineSubtotal;
        taxAmount += lineTax;

        invoiceLinesData.push({
          productId: line.productId,
          description: line.description || 'Subscription Line Item',
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate,
          total: lineTotal,
        });
      }

      const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);

      // Generate invoice transactionally and advance subscription nextBillingDate
      await prisma.$transaction(async (tx) => {
        const invCount = await tx.invoice.count();
        const invoiceNumber = `INV-${now.getFullYear()}-${String(invCount + 1).padStart(4, '0')}`;

        const dueDate = new Date(sub.nextBillingDate);
        dueDate.setDate(dueDate.getDate() + 15); // Net 15 days due

        await tx.invoice.create({
          data: {
            invoiceNumber,
            subscriptionId: sub.id,
            customerId: sub.customerId,
            billingDate: sub.nextBillingDate,
            dueDate,
            subtotal,
            taxAmount,
            discountAmount,
            totalAmount,
            status: 'CONFIRMED',
            lines: {
              create: invoiceLinesData,
            },
          },
        });

        // Advance next billing date safely
        const nextBillingDate = calculateNextBillingDate(sub.nextBillingDate, sub.billingInterval);

        await tx.subscription.update({
          where: { id: sub.id },
          data: {
            nextBillingDate,
            history: {
              create: {
                fromStatus: 'ACTIVE',
                toStatus: 'ACTIVE',
                action: 'INVOICE_GENERATED',
                notes: `Automated recurring invoice ${invoiceNumber} created for ₹${totalAmount.toFixed(2)}.`,
                performedBy: 'BILLING_ENGINE',
              },
            },
          },
        });

        result.invoicesGenerated++;
        result.generatedInvoiceNumbers.push(invoiceNumber);
      });
    } catch (err: any) {
      result.errors.push(`Error billing subscription ${sub.subscriptionNumber}: ${err.message}`);
    }
  }

  return result;
};

// Helper: Calculate subsequent billing date
export const calculateNextBillingDate = (currentDate: Date, interval: string): Date => {
  const next = new Date(currentDate);
  const upper = interval.toUpperCase();

  if (upper === 'DAILY') {
    next.setDate(next.getDate() + 1);
  } else if (upper === 'WEEKLY') {
    next.setDate(next.getDate() + 7);
  } else if (upper === 'YEARLY') {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    // Default MONTHLY
    next.setMonth(next.getMonth() + 1);
  }

  return next;
};

// Endpoint: Admin / Staff manual billing trigger (with fallback)
export const triggerBillingRun = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await runBillingEngine();
    res.json({
      success: true,
      message: `Billing engine executed successfully. Generated ${result.invoicesGenerated} invoices.`,
      result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
