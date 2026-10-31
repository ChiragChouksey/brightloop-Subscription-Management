import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { razorpayInstance, isRazorpayConfigured, verifyRazorpaySignature } from '../config/razorpay.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export const listPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { customerId, invoiceId, method, status } = req.query;

    const where: any = {};

    if (req.user?.role === 'CUSTOMER') {
      where.customerId = req.user.userId;
    } else if (customerId) {
      where.customerId = String(customerId);
    }

    if (invoiceId) where.invoiceId = String(invoiceId);
    if (method) where.method = String(method).toUpperCase();
    if (status) where.status = String(status).toUpperCase();

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, companyName: true } },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a Razorpay Order for an Invoice
 */
export const createRazorpayOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId } = req.body;

    if (!invoiceId) {
      res.status(400).json({ success: false, message: 'Invoice ID is required.' });
      return;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    // Role security
    if (req.user?.role === 'CUSTOMER' && invoice.customerId !== req.user.userId) {
      res.status(403).json({ success: false, message: 'Unauthorized to pay for this invoice.' });
      return;
    }

    if (invoice.status === 'PAID') {
      res.status(400).json({ success: false, message: 'Invoice is already fully paid.' });
      return;
    }

    // Amount in paise for Razorpay (INR)
    const amountInPaise = Math.round(invoice.totalAmount * 100);

    let orderId: string;

    if (isRazorpayConfigured()) {
      const order = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: invoice.invoiceNumber,
        notes: {
          invoiceId: invoice.id,
          customerId: invoice.customerId,
        },
      });
      orderId = order.id;
    } else {
      // Local development mock order ID for testing Razorpay flow seamlessly
      orderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    res.json({
      success: true,
      orderId,
      amount: invoice.totalAmount,
      amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder123',
      invoiceNumber: invoice.invoiceNumber,
      customer: {
        name: invoice.customer.name,
        email: invoice.customer.email,
        phone: invoice.customer.phone || '9999999999',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify Razorpay payment signature & update invoice to PAID
 */
export const verifyRazorpayPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!invoiceId || !razorpayOrderId || !razorpayPaymentId) {
      res.status(400).json({ success: false, message: 'Missing required Razorpay payment verification fields.' });
      return;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    if (invoice.status === 'PAID') {
      res.status(400).json({ success: false, message: 'This invoice has already been settled.' });
      return;
    }

    // Verify cryptographic signature
    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature || 'mock_sig_valid'
    );

    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid payment signature. Verification failed.' });
      return;
    }

    // Record payment and update invoice status atomically
    const payCount = await prisma.payment.count();
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(payCount + 1).padStart(4, '0')}`;

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          amount: invoice.totalAmount,
          method: 'RAZORPAY',
          status: 'SUCCESS',
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature: razorpaySignature || 'mock_sig_verified',
          transactionDate: new Date(),
          notes: `Verified Razorpay payment for ${invoice.invoiceNumber}`,
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      return p;
    });

    res.json({
      success: true,
      message: `Payment ${paymentNumber} recorded successfully. Invoice ${invoice.invoiceNumber} marked as PAID.`,
      payment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Record Manual Payment (Admin/Staff: Cash, Bank Transfer, Cheque)
 */
export const recordManualPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId, amount, method, notes } = req.body;

    if (!invoiceId || amount === undefined) {
      res.status(400).json({ success: false, message: 'Invoice ID and payment amount are required.' });
      return;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    const payCount = await prisma.payment.count();
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(payCount + 1).padStart(4, '0')}`;

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          amount: Number(amount),
          method: method ? method.toUpperCase() : 'BANK_TRANSFER',
          status: 'SUCCESS',
          transactionDate: new Date(),
          notes: notes || 'Manual payment recorded by staff/admin',
        },
      });

      // Check if total paid reaches or exceeds invoice amount
      const existingPayments = await tx.payment.findMany({
        where: { invoiceId: invoice.id, status: 'SUCCESS' },
      });

      const totalPaid = existingPayments.reduce((sum, item) => sum + item.amount, 0);

      if (totalPaid >= invoice.totalAmount) {
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        });
      }

      return p;
    });

    res.status(201).json({
      success: true,
      message: `Payment ${paymentNumber} recorded successfully.`,
      payment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
