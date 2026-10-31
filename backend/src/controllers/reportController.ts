import { Response } from 'express';
import prisma from '../config/prisma.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export const getDashboardAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(String(startDate));
    if (endDate) dateFilter.lte = new Date(String(endDate));

    const now = new Date();

    // 1. Total Active Subscriptions count
    const activeSubscriptionsCount = await prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });

    // 2. Subscriptions status breakdown
    const subscriptionCounts = await prisma.subscription.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const statusBreakdown = {
      ACTIVE: 0,
      DRAFT: 0,
      QUOTATION: 0,
      CONFIRMED: 0,
      PAUSED: 0,
      CLOSED: 0,
    };
    subscriptionCounts.forEach((sc) => {
      if (sc.status in statusBreakdown) {
        (statusBreakdown as any)[sc.status] = sc._count.id;
      }
    });

    // 3. Total Customers
    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    // 4. Total Revenue Received (sum of successful payments)
    const revenueAggregation = await prisma.payment.aggregate({
      where: {
        status: 'SUCCESS',
        ...(startDate || endDate ? { transactionDate: dateFilter } : {}),
      },
      _sum: { amount: true },
    });
    const totalRevenue = revenueAggregation._sum.amount || 0;

    // 5. Outstanding Payments (sum of unpaid/confirmed invoices)
    const outstandingInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['DRAFT', 'CONFIRMED'] },
      },
      select: {
        totalAmount: true,
        dueDate: true,
      },
    });

    let outstandingAmount = 0;
    let overdueAmount = 0;
    let overdueCount = 0;

    outstandingInvoices.forEach((inv) => {
      outstandingAmount += inv.totalAmount;
      if (new Date(inv.dueDate) < now) {
        overdueAmount += inv.totalAmount;
        overdueCount++;
      }
    });

    // 6. Monthly Recurring Revenue (MRR) Calculation
    // Normalized calculation across active subscriptions
    const activeSubs = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: {
        totalAmount: true,
        billingInterval: true,
      },
    });

    let mrr = 0;
    activeSubs.forEach((sub) => {
      const interval = sub.billingInterval.toUpperCase();
      if (interval === 'DAILY') {
        mrr += sub.totalAmount * 30; // normalized to 30 days
      } else if (interval === 'WEEKLY') {
        mrr += (sub.totalAmount * 52) / 12; // normalized to monthly
      } else if (interval === 'YEARLY') {
        mrr += sub.totalAmount / 12; // normalized to monthly
      } else {
        // MONTHLY
        mrr += sub.totalAmount;
      }
    });

    // 7. Monthly Revenue Trend (grouped by last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const paymentsLast6Months = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        transactionDate: { gte: sixMonthsAgo },
      },
      select: {
        amount: true,
        transactionDate: true,
      },
      orderBy: { transactionDate: 'asc' },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap: { [key: string]: number } = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      trendMap[key] = 0;
    }

    paymentsLast6Months.forEach((p) => {
      const d = new Date(p.transactionDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (key in trendMap) {
        trendMap[key] += p.amount;
      }
    });

    const revenueTrends = Object.entries(trendMap).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue * 100) / 100,
    }));

    // Response time benchmark (for PDF under 2 seconds requirement)
    const responseTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      analytics: {
        activeSubscriptionsCount,
        totalCustomers,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        outstandingAmount: Math.round(outstandingAmount * 100) / 100,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        overdueCount,
        mrr: Math.round(mrr * 100) / 100,
        statusBreakdown,
        revenueTrends,
        responseTimeMs,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
