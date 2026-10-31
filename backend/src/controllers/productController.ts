import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export const listProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { active, search } = req.query;

    const where: any = {};
    if (active !== undefined) {
      where.active = active === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { brand: { contains: String(search) } },
        { type: { contains: String(search) } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: true,
        plans: {
          where: { active: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        plans: true,
      },
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    res.json({ success: true, product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, type, salesPrice, costPrice, notes, brand, brandPriceAdjustment, variants } = req.body;

    if (!name || salesPrice === undefined) {
      res.status(400).json({ success: false, message: 'Product name and sales price are required.' });
      return;
    }

    // PDF rule: Selecting the Odoo brand should add ₹560 to the product price
    let computedBrandAdjustment = Number(brandPriceAdjustment || 0);
    if (brand && brand.toLowerCase() === 'odoo' && computedBrandAdjustment === 0) {
      computedBrandAdjustment = 560;
    }

    const product = await prisma.product.create({
      data: {
        name,
        type: type || 'SOFTWARE',
        salesPrice: Number(salesPrice),
        costPrice: Number(costPrice || 0),
        notes: notes || null,
        brand: brand || null,
        brandPriceAdjustment: computedBrandAdjustment,
        variants: variants && Array.isArray(variants) ? {
          create: variants.map((v: any) => ({
            name: v.name,
            priceAdjustment: Number(v.priceAdjustment || 0),
            sku: v.sku || null,
          })),
        } : undefined,
      },
      include: {
        variants: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, type, salesPrice, costPrice, notes, brand, brandPriceAdjustment, active } = req.body;

    let computedBrandAdjustment = brandPriceAdjustment !== undefined ? Number(brandPriceAdjustment) : undefined;
    if (brand && brand.toLowerCase() === 'odoo' && computedBrandAdjustment === 0) {
      computedBrandAdjustment = 560;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        type: type !== undefined ? type : undefined,
        salesPrice: salesPrice !== undefined ? Number(salesPrice) : undefined,
        costPrice: costPrice !== undefined ? Number(costPrice) : undefined,
        notes: notes !== undefined ? notes : undefined,
        brand: brand !== undefined ? brand : undefined,
        brandPriceAdjustment: computedBrandAdjustment,
        active: active !== undefined ? Boolean(active) : undefined,
      },
      include: {
        variants: true,
      },
    });

    res.json({
      success: true,
      message: 'Product updated successfully.',
      product: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    // Check if product is in active subscriptions
    const subCount = await prisma.subscriptionLine.count({ where: { productId: id } });
    if (subCount > 0) {
      // Soft-delete / deactivate safely to preserve billing history integrity
      await prisma.product.update({
        where: { id },
        data: { active: false },
      });
      res.json({
        success: true,
        message: 'Product has active subscriptions. It was safely deactivated instead of deleted.',
      });
      return;
    }

    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addProductVariant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, priceAdjustment, sku } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Variant name is required.' });
      return;
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        name,
        priceAdjustment: Number(priceAdjustment || 0),
        sku: sku || null,
      },
    });

    res.status(201).json({ success: true, variant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
