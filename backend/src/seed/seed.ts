import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

async function main() {
  console.log('🌱 Starting database seeding for Brightloop Subscription Management...');

  // 1. Clean existing records in reverse dependency order
  await prisma.payment.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscriptionHistory.deleteMany();
  await prisma.subscriptionLine.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.quotationLine.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.quotationTemplate.deleteMany();
  await prisma.discountRule.deleteMany();
  await prisma.taxRule.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database tables.');

  // 2. Create Users (Password requirements: >8 chars, uppercase, lowercase, special char)
  const adminPasswordHash = await bcrypt.hash('Admin@Brightloop123', 10);
  const staffPasswordHash = await bcrypt.hash('Staff@Brightloop123', 10);
  const customerPasswordHash = await bcrypt.hash('Customer@Brightloop123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Sarthak (Lead Admin)',
      email: 'admin@brightloop.io',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      phone: '+91 98765 43210',
      companyName: 'Brightloop Software Technologies',
    },
  });

  const staff = await prisma.user.create({
    data: {
      name: 'Chirah (Operations Staff)',
      email: 'staff@brightloop.io',
      passwordHash: staffPasswordHash,
      role: 'STAFF',
      phone: '+91 98765 43211',
      companyName: 'Brightloop Operations',
    },
  });

  const customerApex = await prisma.user.create({
    data: {
      name: 'Rohan Sharma',
      email: 'apex@enterprise.com',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      phone: '+91 98765 43212',
      companyName: 'Apex Technologies Ltd',
    },
  });

  const customerBites = await prisma.user.create({
    data: {
      name: 'Pooja Verma',
      email: 'shop@localbites.com',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      phone: '+91 98765 43213',
      companyName: 'LocalBites Gourmet Foods',
    },
  });

  const customerZenith = await prisma.user.create({
    data: {
      name: 'Arjun Mehta',
      email: 'founder@zenith.ai',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      phone: '+91 98765 43214',
      companyName: 'Zenith AI Research Labs',
    },
  });

  console.log('👤 Created Users: Admin, Staff, and 3 Enterprise Customers.');

  // 3. Create Tax Rules
  const taxGST = await prisma.taxRule.create({
    data: {
      name: 'GST 18%',
      ratePercentage: 18.0,
      isDefault: true,
      active: true,
    },
  });

  const taxVAT = await prisma.taxRule.create({
    data: {
      name: 'VAT 5%',
      ratePercentage: 5.0,
      isDefault: false,
      active: true,
    },
  });

  console.log('🏛️ Created Tax Rules (GST 18%, VAT 5%).');

  // 4. Create Discount Rules
  const discountEarly = await prisma.discountRule.create({
    data: {
      code: 'EARLYBIRD20',
      description: '20% off for high-volume enterprise software plans',
      discountType: 'PERCENTAGE',
      value: 20.0,
      minPurchaseAmount: 5000,
      minQuantity: 1,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      maxUsageLimit: 100,
      currentUsageCount: 4,
      active: true,
    },
  });

  const discountFlat = await prisma.discountRule.create({
    data: {
      code: 'FLAT500',
      description: 'Flat ₹500 instant concession on quarterly renewals',
      discountType: 'FIXED',
      value: 500.0,
      minPurchaseAmount: 3000,
      minQuantity: 1,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      maxUsageLimit: 250,
      currentUsageCount: 12,
      active: true,
    },
  });

  console.log('🏷️ Created Discount Rules (EARLYBIRD20, FLAT500).');

  // 5. Create Products & Variants (with PDF requirement: Odoo Brand adds ₹560)
  const productCRM = await prisma.product.create({
    data: {
      name: 'Brightloop CRM Enterprise',
      type: 'SOFTWARE',
      salesPrice: 4999.0,
      costPrice: 1200.0,
      notes: 'Unified CRM, customer lifecycle tracking, and leads automation.',
      brand: 'Brightloop',
      brandPriceAdjustment: 0,
      active: true,
      variants: {
        create: [
          { name: 'Standard Edition (Up to 5 Users)', priceAdjustment: 0, sku: 'BL-CRM-STD' },
          { name: 'Pro Edition (Unlimited Users)', priceAdjustment: 1500, sku: 'BL-CRM-PRO' },
        ],
      },
    },
  });

  // Odoo Brand Product (PDF Example: Selecting Odoo brand adds 560 to price)
  const productOdoo = await prisma.product.create({
    data: {
      name: 'Brightloop Odoo ERP Connector',
      type: 'SOFTWARE',
      salesPrice: 6500.0,
      costPrice: 2000.0,
      notes: 'Native two-way connector to Odoo modules with automatic catalog synchronization.',
      brand: 'Odoo',
      brandPriceAdjustment: 560.0, // EXACT PDF RULE
      active: true,
      variants: {
        create: [
          { name: 'Odoo Community Edition', priceAdjustment: 0, sku: 'ODOO-COMM-01' },
          { name: 'Odoo Enterprise Edition', priceAdjustment: 1200, sku: 'ODOO-ENT-02' },
        ],
      },
    },
  });

  const productMarketing = await prisma.product.create({
    data: {
      name: 'Automated Marketing Booster Add-on',
      type: 'ADDON',
      salesPrice: 1499.0,
      costPrice: 350.0,
      notes: 'Omnichannel email, WhatsApp, and SMS triggered drip campaigns.',
      brand: 'Brightloop',
      brandPriceAdjustment: 0,
      active: true,
    },
  });

  const productSupport = await prisma.product.create({
    data: {
      name: '24/7 Dedicated Priority Support SLA',
      type: 'SERVICE',
      salesPrice: 2999.0,
      costPrice: 800.0,
      notes: 'Guaranteed 15-minute response SLA with dedicated TAM.',
      brand: 'Brightloop',
      brandPriceAdjustment: 0,
      active: true,
    },
  });

  console.log('📦 Created Products with Variants and Odoo Brand (+₹560).');

  // 6. Create Plans (Daily, Weekly, Monthly, Yearly + permissions)
  const planCRMMonthly = await prisma.plan.create({
    data: {
      name: 'CRM Pro Monthly Plan',
      productId: productCRM.id,
      price: 4999.0,
      billingInterval: 'MONTHLY',
      minQuantity: 1,
      autoCloseOnEnd: false,
      allowEarlyClosure: true,
      allowPause: true,
      allowRenewal: true,
      active: true,
    },
  });

  const planCRMYearly = await prisma.plan.create({
    data: {
      name: 'CRM Enterprise Yearly Contract',
      productId: productCRM.id,
      price: 49990.0, // 2 months free
      billingInterval: 'YEARLY',
      minQuantity: 1,
      autoCloseOnEnd: true,
      allowEarlyClosure: true,
      allowPause: true,
      allowRenewal: true,
      active: true,
    },
  });

  const planOdooMonthly = await prisma.plan.create({
    data: {
      name: 'Odoo Connected ERP Monthly',
      productId: productOdoo.id,
      price: 7060.0, // 6500 base + 560 brand addition
      billingInterval: 'MONTHLY',
      minQuantity: 1,
      autoCloseOnEnd: true,
      allowEarlyClosure: true,
      allowPause: true,
      allowRenewal: true,
      active: true,
    },
  });

  const planAddonWeekly = await prisma.plan.create({
    data: {
      name: 'Marketing Booster Weekly Sprint',
      productId: productMarketing.id,
      price: 450.0,
      billingInterval: 'WEEKLY',
      minQuantity: 1,
      autoCloseOnEnd: true,
      allowEarlyClosure: true,
      allowPause: false,
      allowRenewal: true,
      active: true,
    },
  });

  console.log('🗓️ Created Subscription Plans (Daily/Weekly/Monthly/Yearly with rules).');

  // 7. Create Quotation Template & Quotation
  const templateEnterprise = await prisma.quotationTemplate.create({
    data: {
      name: 'Enterprise Full Stack SaaS Template',
      description: 'Standard 30-day quote template containing CRM Pro + Odoo Connector + Priority SLA',
      planId: planCRMYearly.id,
      defaultValidityDays: 30,
      notes: 'Includes dedicated account manager onboarding.',
    },
  });

  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + 30);

  const quotationZenith = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-0001',
      customerId: customerZenith.id,
      planId: planCRMYearly.id,
      templateId: templateEnterprise.id,
      validityDate,
      status: 'SENT',
      subtotal: 49990.0,
      taxAmount: 8998.2, // 18% GST
      discountAmount: 5000.0, // Custom negotiated discount
      totalAmount: 53988.2,
      notes: 'Special early-stage startup deal prepared by Chirah.',
      lines: {
        create: [
          {
            productId: productCRM.id,
            description: 'CRM Enterprise Yearly Contract (Unlimited Seats)',
            quantity: 1,
            unitPrice: 49990.0,
            taxRate: 18.0,
            total: 58988.2,
          },
        ],
      },
    },
  });

  console.log('📋 Created Quotation Template & Quotation QT-2026-0001.');

  // 8. Create Subscriptions
  // Subscription 1: Apex Technologies (ACTIVE, Monthly)
  const sub1Start = new Date('2026-01-01');
  const sub1Next = new Date();
  sub1Next.setDate(sub1Next.getDate() + 14); // Next billing in 14 days
  const sub1Expiry = new Date('2027-01-01');

  const subApex = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-0001',
      customerId: customerApex.id,
      planId: planCRMMonthly.id,
      status: 'ACTIVE',
      billingInterval: 'MONTHLY',
      startDate: sub1Start,
      expiryDate: sub1Expiry,
      nextBillingDate: sub1Next,
      paymentTerms: 'Net 15',
      autoCloseOnEnd: true,
      subtotal: 4999.0,
      taxAmount: 899.82,
      discountAmount: 0,
      totalAmount: 5898.82,
      lines: {
        create: [
          {
            productId: productCRM.id,
            description: 'Brightloop CRM Enterprise - Pro Edition',
            quantity: 1,
            unitPrice: 4999.0,
            taxRate: 18.0,
            total: 5898.82,
          },
        ],
      },
      history: {
        create: [
          {
            fromStatus: null,
            toStatus: 'ACTIVE',
            action: 'CREATED_AND_ACTIVATED',
            notes: 'Contract finalized and initiated.',
            performedBy: 'ADMIN',
          },
        ],
      },
    },
  });

  // Subscription 2: LocalBites Gourmet (ACTIVE, DUE FOR BILLING TODAY)
  const todayDue = new Date();
  todayDue.setHours(0, 0, 0, 0); // Due today! Test button can bill it!

  const subBites = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-0002',
      customerId: customerBites.id,
      planId: planOdooMonthly.id,
      status: 'ACTIVE',
      billingInterval: 'MONTHLY',
      startDate: new Date('2026-02-01'),
      expiryDate: new Date('2027-02-01'),
      nextBillingDate: todayDue,
      paymentTerms: 'Immediate',
      autoCloseOnEnd: true,
      subtotal: 7060.0,
      taxAmount: 1270.8,
      discountAmount: 500.0, // FLAT500 applied
      totalAmount: 7830.8,
      lines: {
        create: [
          {
            productId: productOdoo.id,
            description: 'Brightloop Odoo ERP Connector (Includes ₹560 Odoo brand fee)',
            quantity: 1,
            unitPrice: 7060.0,
            taxRate: 18.0,
            total: 7830.8,
          },
        ],
      },
      history: {
        create: [
          {
            fromStatus: null,
            toStatus: 'ACTIVE',
            action: 'ACTIVATED',
            notes: 'Active monthly billing cycle configured.',
            performedBy: 'STAFF',
          },
        ],
      },
    },
  });

  // Subscription 3: Zenith AI (PAUSED)
  const subZenith = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-0003',
      customerId: customerZenith.id,
      planId: planAddonWeekly.id,
      status: 'PAUSED',
      billingInterval: 'WEEKLY',
      startDate: new Date('2026-02-15'),
      expiryDate: new Date('2026-08-15'),
      nextBillingDate: new Date('2026-03-30'),
      paymentTerms: 'Immediate',
      autoCloseOnEnd: true,
      pausedAt: new Date(),
      subtotal: 450.0,
      taxAmount: 81.0,
      discountAmount: 0,
      totalAmount: 531.0,
      lines: {
        create: [
          {
            productId: productMarketing.id,
            description: 'Automated Marketing Booster Add-on (Weekly)',
            quantity: 1,
            unitPrice: 450.0,
            taxRate: 18.0,
            total: 531.0,
          },
        ],
      },
      history: {
        create: [
          {
            fromStatus: 'ACTIVE',
            toStatus: 'PAUSED',
            action: 'PAUSED',
            notes: 'Customer requested pause during internal migration sprint.',
            performedBy: 'CUSTOMER',
          },
        ],
      },
    },
  });

  console.log('🔄 Created Subscriptions: SUB-2026-0001 (Active), SUB-2026-0002 (Due Today), SUB-2026-0003 (Paused).');

  // 9. Create Invoices & Payments
  // Invoice 1: PAID with Razorpay
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      subscriptionId: subApex.id,
      customerId: customerApex.id,
      billingDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
      subtotal: 4999.0,
      taxAmount: 899.82,
      discountAmount: 0,
      totalAmount: 5898.82,
      status: 'PAID',
      sentAt: new Date('2026-01-01'),
      paidAt: new Date('2026-01-05'),
      lines: {
        create: [
          {
            productId: productCRM.id,
            description: 'Brightloop CRM Enterprise - Pro Edition (Monthly Cycle)',
            quantity: 1,
            unitPrice: 4999.0,
            taxRate: 18.0,
            total: 5898.82,
          },
        ],
      },
    },
  });

  const payment1 = await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-0001',
      invoiceId: inv1.id,
      customerId: customerApex.id,
      amount: 5898.82,
      method: 'RAZORPAY',
      status: 'SUCCESS',
      razorpayOrderId: 'order_test_9876543210',
      razorpayPaymentId: 'pay_test_1234567890',
      razorpaySignature: 'mock_sig_apex_01',
      transactionDate: new Date('2026-01-05'),
      notes: 'Settled via Razorpay UPI auto-debit.',
    },
  });

  // Invoice 2: CONFIRMED (Unpaid / Open)
  const inv2DueDate = new Date();
  inv2DueDate.setDate(inv2DueDate.getDate() + 7);

  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0002',
      subscriptionId: subApex.id,
      customerId: customerApex.id,
      billingDate: new Date(),
      dueDate: inv2DueDate,
      subtotal: 4999.0,
      taxAmount: 899.82,
      discountAmount: 0,
      totalAmount: 5898.82,
      status: 'CONFIRMED',
      sentAt: new Date(),
      lines: {
        create: [
          {
            productId: productCRM.id,
            description: 'Brightloop CRM Enterprise - Pro Edition (Current Period)',
            quantity: 1,
            unitPrice: 4999.0,
            taxRate: 18.0,
            total: 5898.82,
          },
        ],
      },
    },
  });

  // Invoice 3: OVERDUE (Due date was 12 days ago)
  const overdueBilling = new Date();
  overdueBilling.setDate(overdueBilling.getDate() - 30);
  const overdueDue = new Date();
  overdueDue.setDate(overdueDue.getDate() - 15); // Expired 15 days ago

  const inv3 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0003',
      subscriptionId: subBites.id,
      customerId: customerBites.id,
      billingDate: overdueBilling,
      dueDate: overdueDue,
      subtotal: 7060.0,
      taxAmount: 1270.8,
      discountAmount: 500.0,
      totalAmount: 7830.8,
      status: 'CONFIRMED',
      sentAt: overdueBilling,
      lines: {
        create: [
          {
            productId: productOdoo.id,
            description: 'Brightloop Odoo ERP Connector (Previous Cycle)',
            quantity: 1,
            unitPrice: 7060.0,
            taxRate: 18.0,
            total: 7830.8,
          },
        ],
      },
    },
  });

  console.log('💰 Created Invoices: INV-0001 (Paid), INV-0002 (Outstanding), INV-0003 (Overdue).');
  console.log('💳 Created Verified Payment PAY-2026-0001.');
  console.log('✨ Seed database populated with 100% complete test data!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
