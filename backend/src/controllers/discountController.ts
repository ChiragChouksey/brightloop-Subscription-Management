import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export const listDiscountRules = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { active } = req.query;
    const where: any = {};
    if (active !== undefined) where.active = active === 'true';

    const discounts = await prisma.discountRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, discounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDiscountRule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      code,
      description,
      discountType,
      value,
      minPurchaseAmount,
      minQuantity,
      startDate,
      endDate,
      maxUsageLimit,
      applicableProductId,
    } = req.body;

    if (!code || value === undefined) {
      res.status(400).json({ success: false, message: 'Discount code and value are required.' });
      return;
    }

    const existing = await prisma.discountRule.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      res.status(409).json({ success: false, message: 'Discount code already exists.' });
      return;
    }

    const discount = await prisma.discountRule.create({
      data: {
        code: code.toUpperCase().trim(),
        description,
        discountType: discountType ? discountType.toUpperCase() : 'PERCENTAGE',
        value: Number(value),
        minPurchaseAmount: Number(minPurchaseAmount || 0),
        minQuantity: Number(minQuantity || 1),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        maxUsageLimit: Number(maxUsageLimit || 100),
        applicableProductId: applicableProductId || null,
      },
    });

    res.status(201).json({ success: true, message: 'Discount rule created successfully.', discount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDiscountRule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const {
      description,
      discountType,
      value,
      minPurchaseAmount,
      minQuantity,
      startDate,
      endDate,
      maxUsageLimit,
      applicableProductId,
      active,
    } = req.body;

    const updated = await prisma.discountRule.update({
      where: { id },
      data: {
        description: description !== undefined ? description : undefined,
        discountType: discountType ? discountType.toUpperCase() : undefined,
        value: value !== undefined ? Number(value) : undefined,
        minPurchaseAmount: minPurchaseAmount !== undefined ? Number(minPurchaseAmount) : undefined,
        minQuantity: minQuantity !== undefined ? Number(minQuantity) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        maxUsageLimit: maxUsageLimit !== undefined ? Number(maxUsageLimit) : undefined,
        applicableProductId: applicableProductId !== undefined ? applicableProductId : undefined,
        active: active !== undefined ? Boolean(active) : undefined,
      },
    });

    res.json({ success: true, message: 'Discount rule updated successfully.', discount: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDiscountRule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.discountRule.delete({ where: { id } });
    res.json({ success: true, message: 'Discount rule deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// VALIDATE DISCOUNT ELIGIBILITY (Helper API for quotation & invoice creation)
export const validateDiscountEligibility = async (
  code: string,
  totalAmount: number,
  totalQuantity: number,
  productIds: string[] = []
): Promise<{ valid: boolean; discountAmount: number; discount?: any; reason?: string }> => {
  const discount = await prisma.discountRule.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!discount || !discount.active) {
    return { valid: false, discountAmount: 0, reason: 'Discount code is invalid or inactive.' };
  }

  const now = new Date();
  if (discount.startDate > now) {
    return { valid: false, discountAmount: 0, reason: 'Discount is not yet active.' };
  }
  if (discount.endDate && discount.endDate < now) {
    return { valid: false, discountAmount: 0, reason: 'Discount has expired.' };
  }
  if (discount.currentUsageCount >= discount.maxUsageLimit) {
    return { valid: false, discountAmount: 0, reason: 'Discount usage limit has been reached.' };
  }
  if (totalAmount < discount.minPurchaseAmount) {
    return {
      valid: false,
      discountAmount: 0,
      reason: `Minimum purchase amount of ₹${discount.minPurchaseAmount} required for this discount.`,
    };
  }
  if (totalQuantity < discount.minQuantity) {
    return {
      valid: false,
      discountAmount: 0,
      reason: `Minimum quantity of ${discount.minQuantity} items required for this discount.`,
    };
  }

  // Product specific check
  if (discount.applicableProductId && !productIds.includes(discount.applicableProductId)) {
    return {
      valid: false,
      discountAmount: 0,
      reason: 'Discount code is not applicable to any products in this order.',
    };
  }

  let calculatedDiscount = 0;
  if (discount.discountType === 'PERCENTAGE') {
    calculatedDiscount = (totalAmount * discount.value) / 100;
  } else {
    calculatedDiscount = Math.min(discount.value, totalAmount);
  }

  return {
    valid: true,
    discountAmount: Math.round(calculatedDiscount * 100) / 100,
    discount,
  };
};

export const checkDiscount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { code, amount, quantity, productIds } = req.body;
    if (!code) {
      res.status(400).json({ success: false, message: 'Discount code is required.' });
      return;
    }

    const result = await validateDiscountEligibility(
      code,
      Number(amount || 0),
      Number(quantity || 1),
      productIds || []
    );

    res.json({ success: result.valid, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
