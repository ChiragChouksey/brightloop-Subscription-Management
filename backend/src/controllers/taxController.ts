import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export const listTaxRules = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { active } = req.query;
    const where: any = {};
    if (active !== undefined) where.active = active === 'true';

    const taxRules = await prisma.taxRule.findMany({
      where,
      orderBy: { ratePercentage: 'asc' },
    });

    res.json({ success: true, taxRules });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTaxRule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, ratePercentage, isDefault } = req.body;

    if (!name || ratePercentage === undefined) {
      res.status(400).json({ success: false, message: 'Tax name and rate percentage are required.' });
      return;
    }

    if (isDefault) {
      // Unset previous defaults
      await prisma.taxRule.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const taxRule = await prisma.taxRule.create({
      data: {
        name,
        ratePercentage: Number(ratePercentage),
        isDefault: Boolean(isDefault),
      },
    });

    res.status(201).json({ success: true, message: 'Tax rule created successfully.', taxRule });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTaxRule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, ratePercentage, isDefault, active } = req.body;

    if (isDefault) {
      await prisma.taxRule.updateMany({
        where: { id: { not: id }, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.taxRule.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        ratePercentage: ratePercentage !== undefined ? Number(ratePercentage) : undefined,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined,
        active: active !== undefined ? Boolean(active) : undefined,
      },
    });

    res.json({ success: true, message: 'Tax rule updated successfully.', taxRule: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTaxRule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.taxRule.delete({ where: { id } });
    res.json({ success: true, message: 'Tax rule deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
