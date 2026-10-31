import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export const listTemplates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const templates = await prisma.quotationTemplate.findMany({
      include: {
        plan: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, templates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description, planId, defaultValidityDays, notes } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Template name is required.' });
      return;
    }

    const template = await prisma.quotationTemplate.create({
      data: {
        name,
        description,
        planId: planId || null,
        defaultValidityDays: Number(defaultValidityDays || 30),
        notes,
      },
      include: {
        plan: { include: { product: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Quotation template created.', template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listQuotations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { customerId, status } = req.query;
    const where: any = {};

    if (req.user?.role === 'CUSTOMER') {
      where.customerId = req.user.userId;
    } else if (customerId) {
      where.customerId = String(customerId);
    }

    if (status) where.status = String(status).toUpperCase();

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, companyName: true } },
        plan: true,
        template: true,
        lines: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, quotations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createQuotation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { customerId, planId, templateId, validityDays, lines, notes, discountCode } = req.body;

    const targetCustomerId = req.user?.role === 'CUSTOMER' ? req.user.userId : customerId;
    if (!targetCustomerId) {
      res.status(400).json({ success: false, message: 'Customer ID is required.' });
      return;
    }

    // Generate unique Quotation number
    const count = await prisma.quotation.count();
    const quotationNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Validity date calculation
    const days = Number(validityDays || 30);
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + days);

    // Calculate lines
    let subtotal = 0;
    let taxAmount = 0;
    const processedLines = [];

    if (lines && Array.isArray(lines) && lines.length > 0) {
      for (const line of lines) {
        const product = await prisma.product.findUnique({ where: { id: line.productId } });
        if (!product) continue;

        const quantity = Number(line.quantity || 1);
        const unitPrice = line.unitPrice !== undefined ? Number(line.unitPrice) : product.salesPrice;
        const taxRate = Number(line.taxRate || 18); // default 18% GST if not provided

        const lineSubtotal = quantity * unitPrice;
        const lineTax = (lineSubtotal * taxRate) / 100;
        const lineTotal = lineSubtotal + lineTax;

        subtotal += lineSubtotal;
        taxAmount += lineTax;

        processedLines.push({
          productId: line.productId,
          description: line.description || product.name,
          quantity,
          unitPrice,
          taxRate,
          total: lineTotal,
        });
      }
    } else if (planId) {
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
        include: { product: true },
      });

      if (plan) {
        const unitPrice = plan.price;
        const quantity = plan.minQuantity || 1;
        const taxRate = 18;
        const lineSubtotal = unitPrice * quantity;
        const lineTax = (lineSubtotal * taxRate) / 100;
        const lineTotal = lineSubtotal + lineTax;

        subtotal += lineSubtotal;
        taxAmount += lineTax;

        processedLines.push({
          productId: plan.productId,
          description: `${plan.name} (${plan.billingInterval})`,
          quantity,
          unitPrice,
          taxRate,
          total: lineTotal,
        });
      }
    }

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

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: targetCustomerId,
        planId: planId || null,
        templateId: templateId || null,
        validityDate,
        status: 'DRAFT',
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        notes: notes || null,
        lines: {
          create: processedLines,
        },
      },
      include: {
        customer: true,
        lines: { include: { product: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Quotation generated successfully.', quotation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CONVERT QUOTATION TO SUBSCRIPTION (Key requirement)
export const convertQuotationToSubscription = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        plan: true,
        lines: true,
      },
    });

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found.' });
      return;
    }

    // Customer can only convert their own quotation
    if (req.user?.role === 'CUSTOMER' && quotation.customerId !== req.user.userId) {
      res.status(403).json({ success: false, message: 'Unauthorized to convert this quotation.' });
      return;
    }

    if (!quotation.planId) {
      res.status(400).json({ success: false, message: 'Quotation must have an associated plan to convert into a subscription.' });
      return;
    }

    const subCount = await prisma.subscription.count();
    const subscriptionNumber = `SUB-${new Date().getFullYear()}-${String(subCount + 1).padStart(4, '0')}`;

    const startDate = new Date();
    const nextBillingDate = new Date();

    // calculate interval for next billing
    const plan = quotation.plan!;
    if (plan.billingInterval === 'DAILY') {
      nextBillingDate.setDate(nextBillingDate.getDate() + 1);
    } else if (plan.billingInterval === 'WEEKLY') {
      nextBillingDate.setDate(nextBillingDate.getDate() + 7);
    } else if (plan.billingInterval === 'YEARLY') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year default

    // Create subscription transactionally
    const subscription = await prisma.$transaction(async (tx) => {
      // 1. Create subscription
      const sub = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId: quotation.customerId,
          planId: quotation.planId!,
          quotationId: quotation.id,
          status: 'ACTIVE',
          billingInterval: plan.billingInterval,
          startDate,
          expiryDate,
          nextBillingDate,
          paymentTerms: 'Immediate',
          autoCloseOnEnd: plan.autoCloseOnEnd,
          subtotal: quotation.subtotal,
          taxAmount: quotation.taxAmount,
          discountAmount: quotation.discountAmount,
          totalAmount: quotation.totalAmount,
          lines: {
            create: quotation.lines.map((ql) => ({
              productId: ql.productId,
              description: ql.description,
              quantity: ql.quantity,
              unitPrice: ql.unitPrice,
              taxRate: ql.taxRate,
              total: ql.total,
            })),
          },
          history: {
            create: {
              fromStatus: 'QUOTATION',
              toStatus: 'ACTIVE',
              action: 'CONVERTED_FROM_QUOTATION',
              notes: `Converted from quotation ${quotation.quotationNumber}`,
              performedBy: req.user?.role || 'SYSTEM',
            },
          },
        },
        include: {
          lines: true,
        },
      });

      // 2. Mark quotation as converted
      await tx.quotation.update({
        where: { id: quotation.id },
        data: { status: 'CONVERTED' },
      });

      // 3. Immediately generate first invoice for the active subscription
      const invCount = await tx.invoice.count();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invCount + 1).padStart(4, '0')}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15);

      await tx.invoice.create({
        data: {
          invoiceNumber,
          subscriptionId: sub.id,
          customerId: quotation.customerId,
          billingDate: startDate,
          dueDate,
          subtotal: quotation.subtotal,
          taxAmount: quotation.taxAmount,
          discountAmount: quotation.discountAmount,
          totalAmount: quotation.totalAmount,
          status: 'CONFIRMED',
          lines: {
            create: quotation.lines.map((ql) => ({
              productId: ql.productId,
              description: ql.description || 'Subscription Line Item',
              quantity: ql.quantity,
              unitPrice: ql.unitPrice,
              taxRate: ql.taxRate,
              total: ql.total,
            })),
          },
        },
      });

      return sub;
    });

    res.status(201).json({
      success: true,
      message: 'Quotation successfully converted to Active Subscription and first invoice generated!',
      subscription,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
