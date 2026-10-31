export type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  companyName?: string;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  priceAdjustment: number;
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  type: string;
  salesPrice: number;
  costPrice: number;
  notes?: string;
  brand?: string;
  brandPriceAdjustment: number;
  active: boolean;
  variants?: ProductVariant[];
  plans?: Plan[];
}

export interface Plan {
  id: string;
  name: string;
  productId: string;
  price: number;
  billingInterval: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  minQuantity: number;
  availableFrom: string;
  availableUntil?: string;
  autoCloseOnEnd: boolean;
  allowEarlyClosure: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  active: boolean;
  product?: Product;
}

export interface TaxRule {
  id: string;
  name: string;
  ratePercentage: number;
  isDefault: boolean;
  active: boolean;
}

export interface DiscountRule {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  value: number;
  minPurchaseAmount: number;
  minQuantity: number;
  startDate: string;
  endDate?: string;
  maxUsageLimit: number;
  currentUsageCount: number;
  applicableProductId?: string;
  active: boolean;
}

export interface QuotationLine {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
  product?: Product;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  planId?: string;
  templateId?: string;
  validityDate: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  customer?: User;
  plan?: Plan;
  lines?: QuotationLine[];
}

export interface SubscriptionLine {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
  product?: Product;
}

export interface SubscriptionHistory {
  id: string;
  fromStatus?: string;
  toStatus: string;
  action: string;
  notes?: string;
  performedBy: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  planId: string;
  quotationId?: string;
  status: 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
  billingInterval: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  expiryDate?: string;
  nextBillingDate: string;
  paymentTerms: string;
  autoCloseOnEnd: boolean;
  pausedAt?: string;
  closedAt?: string;
  cancellationReason?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  customer?: User;
  plan?: Plan;
  lines?: SubscriptionLine[];
  history?: SubscriptionHistory[];
  invoices?: Invoice[];
}

export interface InvoiceLine {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
  product?: Product;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionId?: string;
  customerId: string;
  billingDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';
  sentAt?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  customer?: User;
  subscription?: Subscription;
  lines?: InvoiceLine[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  method: 'RAZORPAY' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  transactionDate: string;
  notes?: string;
  customer?: User;
  invoice?: Invoice;
}

export interface AnalyticsData {
  activeSubscriptionsCount: number;
  totalCustomers: number;
  totalRevenue: number;
  outstandingAmount: number;
  overdueAmount: number;
  overdueCount: number;
  mrr: number;
  statusBreakdown: {
    ACTIVE: number;
    DRAFT: number;
    QUOTATION: number;
    CONFIRMED: number;
    PAUSED: number;
    CLOSED: number;
  };
  revenueTrends: Array<{
    month: string;
    revenue: number;
  }>;
  responseTimeMs: number;
}
