const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5050/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('brightloop_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('brightloop_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('brightloop_token');
};

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),
  forgotPassword: (email: string) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload: any) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  createStaff: (staffData: any) => request('/auth/staff', { method: 'POST', body: JSON.stringify(staffData) }),
  getUsers: (role?: string) => request(`/auth/users${role ? `?role=${role}` : ''}`),

  // Products
  getProducts: (params?: any) => {
    const q = new URLSearchParams(params).toString();
    return request(`/products${q ? `?${q}` : ''}`);
  },
  getProduct: (id: string) => request(`/products/${id}`),
  createProduct: (data: any) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request(`/products/${id}`, { method: 'DELETE' }),
  addProductVariant: (id: string, data: any) => request(`/products/${id}/variants`, { method: 'POST', body: JSON.stringify(data) }),

  // Plans
  getPlans: (params?: any) => {
    const q = new URLSearchParams(params).toString();
    return request(`/plans${q ? `?${q}` : ''}`);
  },
  createPlan: (data: any) => request('/plans', { method: 'POST', body: JSON.stringify(data) }),
  updatePlan: (id: string, data: any) => request(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlan: (id: string) => request(`/plans/${id}`, { method: 'DELETE' }),

  // Quotations
  getQuotationTemplates: () => request('/quotations/templates'),
  createQuotationTemplate: (data: any) => request('/quotations/templates', { method: 'POST', body: JSON.stringify(data) }),
  getQuotations: (params?: any) => {
    const q = new URLSearchParams(params).toString();
    return request(`/quotations${q ? `?${q}` : ''}`);
  },
  createQuotation: (data: any) => request('/quotations', { method: 'POST', body: JSON.stringify(data) }),
  convertQuotation: (id: string) => request(`/quotations/${id}/convert`, { method: 'POST' }),

  // Subscriptions
  getSubscriptions: (params?: any) => {
    const q = new URLSearchParams(params).toString();
    return request(`/subscriptions${q ? `?${q}` : ''}`);
  },
  getSubscription: (id: string) => request(`/subscriptions/${id}`),
  createSubscription: (data: any) => request('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  updateSubscriptionStatus: (id: string, status: string, notes?: string) =>
    request(`/subscriptions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
  pauseSubscription: (id: string, reason?: string) =>
    request(`/subscriptions/${id}/pause`, { method: 'POST', body: JSON.stringify({ reason }) }),
  resumeSubscription: (id: string) => request(`/subscriptions/${id}/resume`, { method: 'POST' }),
  renewSubscription: (id: string) => request(`/subscriptions/${id}/renew`, { method: 'POST' }),
  closeSubscriptionEarly: (id: string, reason?: string) =>
    request(`/subscriptions/${id}/close`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Invoices & Billing
  getInvoices: (params?: any) => {
    const q = new URLSearchParams(params).toString();
    return request(`/invoices${q ? `?${q}` : ''}`);
  },
  getInvoice: (id: string) => request(`/invoices/${id}`),
  updateInvoiceStatus: (id: string, status: string) =>
    request(`/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  sendInvoice: (id: string) => request(`/invoices/${id}/send`, { method: 'POST' }),
  triggerBillingEngine: () => request('/billing/trigger', { method: 'POST' }),

  // Taxes
  getTaxRules: () => request('/taxes'),
  createTaxRule: (data: any) => request('/taxes', { method: 'POST', body: JSON.stringify(data) }),
  updateTaxRule: (id: string, data: any) => request(`/taxes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTaxRule: (id: string) => request(`/taxes/${id}`, { method: 'DELETE' }),

  // Discounts
  getDiscountRules: () => request('/discounts'),
  createDiscountRule: (data: any) => request('/discounts', { method: 'POST', body: JSON.stringify(data) }),
  updateDiscountRule: (id: string, data: any) => request(`/discounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDiscountRule: (id: string) => request(`/discounts/${id}`, { method: 'DELETE' }),
  checkDiscount: (payload: any) => request('/discounts/check', { method: 'POST', body: JSON.stringify(payload) }),

  // Payments
  getPayments: (params?: any) => {
    const q = new URLSearchParams(params).toString();
    return request(`/payments${q ? `?${q}` : ''}`);
  },
  createRazorpayOrder: (invoiceId: string) =>
    request('/payments/razorpay/order', { method: 'POST', body: JSON.stringify({ invoiceId }) }),
  verifyRazorpayPayment: (payload: any) =>
    request('/payments/razorpay/verify', { method: 'POST', body: JSON.stringify(payload) }),
  recordManualPayment: (data: any) =>
    request('/payments/manual', { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getAnalytics: (params?: any) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/analytics${q ? `?${q}` : ''}`);
  },
};
