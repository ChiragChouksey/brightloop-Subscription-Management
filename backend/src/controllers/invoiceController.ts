import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export const listInvoices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, customerId, overdue, search, startDate, endDate } = req.query;

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

    if (overdue === 'true') {
      where.status = { in: ['DRAFT', 'CONFIRMED'] };
      where.dueDate = { lt: new Date() };
    }

    if (startDate || endDate) {
      where.billingDate = {};
      if (startDate) where.billingDate.gte = new Date(String(startDate));
      if (endDate) where.billingDate.lte = new Date(String(endDate));
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: String(search) } },
        { customer: { name: { contains: String(search) } } },
        { customer: { email: { contains: String(search) } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, companyName: true, phone: true } },
        subscription: { select: { id: true, subscriptionNumber: true, billingInterval: true } },
        lines: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, invoices });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: {
          include: {
            plan: true,
          },
        },
        lines: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    if (req.user?.role === 'CUSTOMER' && invoice.customerId !== req.user.userId) {
      res.status(403).json({ success: false, message: 'Access denied to this invoice.' });
      return;
    }

    res.json({ success: true, invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInvoiceStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const allowed = ['DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED'];
    const newStatus = String(status).toUpperCase();

    if (!allowed.includes(newStatus)) {
      res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowed.join(', ')}` });
      return;
    }

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: newStatus,
        paidAt: newStatus === 'PAID' ? new Date() : undefined,
      },
    });

    res.json({ success: true, message: `Invoice status updated to ${newStatus}.`, invoice: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        sentAt: new Date(),
      },
      include: { customer: true },
    });

    res.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} dispatched to ${invoice.customer?.email || 'customer'}.`,
      invoice,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
