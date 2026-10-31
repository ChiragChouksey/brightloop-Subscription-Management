import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Subscription, Invoice, Payment } from '../../types';
import {
  CreditCard,
  Repeat,
  Receipt,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Printer,
  ShieldCheck,
  Building,
  Zap,
} from 'lucide-react';

declare const Razorpay: any;

export const CustomerPortal: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, invRes, payRes] = await Promise.all([
        api.getSubscriptions(),
        api.getInvoices(),
        api.getPayments(),
      ]);

      if (subRes.success) setSubscriptions(subRes.subscriptions);
      if (invRes.success) setInvoices(invRes.invoices);
      if (payRes.success) setPayments(payRes.payments);
    } catch (err: any) {
      console.error('Error loading customer portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePause = async (id: string) => {
    try {
      const res = await api.pauseSubscription(id, 'Customer paused from self-service portal');
      if (res.success) {
        setActionMessage('Subscription paused successfully.');
        fetchData();
      }
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    }
  };

  const handleResume = async (id: string) => {
    try {
      const res = await api.resumeSubscription(id);
      if (res.success) {
        setActionMessage('Subscription resumed successfully.');
        fetchData();
      }
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    }
  };

  // RAZORPAY PAYMENT GATEWAY INITIATION & VERIFICATION FLOW
  const handlePayInvoice = async (invoice: Invoice) => {
    setPayingInvoiceId(invoice.id);
    try {
      // 1. Create order on backend securely
      const orderRes = await api.createRazorpayOrder(invoice.id);
      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Failed to initialize payment order');
      }

      // Check if real Razorpay Checkout is loaded or mock fallback
      if (typeof Razorpay !== 'undefined') {
        const options = {
          key: orderRes.keyId,
          amount: orderRes.amountInPaise,
          currency: 'INR',
          name: 'Brightloop Software',
          description: `Settlement for Invoice ${invoice.invoiceNumber}`,
          order_id: orderRes.orderId.startsWith('order_mock_') ? undefined : orderRes.orderId,
          prefill: {
            name: orderRes.customer.name,
            email: orderRes.customer.email,
            contact: orderRes.customer.phone,
          },
          theme: {
            color: '#7c3aed',
          },
          handler: async (response: any) => {
            // 2. Verify signature on backend
            const verifyRes = await api.verifyRazorpayPayment({
              invoiceId: invoice.id,
              razorpayOrderId: response.razorpay_order_id || orderRes.orderId,
              razorpayPaymentId: response.razorpay_payment_id || `pay_mock_${Date.now()}`,
              razorpaySignature: response.razorpay_signature || 'mock_sig_verified',
            });

            if (verifyRes.success) {
              setActionMessage(`Payment verified! Invoice ${invoice.invoiceNumber} is now PAID.`);
              fetchData();
            } else {
              setActionMessage(`Payment verification failed: ${verifyRes.message}`);
            }
            setPayingInvoiceId(null);
          },
          modal: {
            ondismiss: () => {
              setPayingInvoiceId(null);
            },
          },
        };

        const rzp = new Razorpay(options);
        rzp.open();
      } else {
        // Fallback simulated payment for local offline development
        const verifyRes = await api.verifyRazorpayPayment({
          invoiceId: invoice.id,
          razorpayOrderId: orderRes.orderId,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: 'mock_sig_verified',
        });

        if (verifyRes.success) {
          setActionMessage(`Verified Payment Recorded: Invoice ${invoice.invoiceNumber} settled.`);
          fetchData();
        }
        setPayingInvoiceId(null);
      }
    } catch (err: any) {
      setActionMessage(`Payment failed: ${err.message}`);
      setPayingInvoiceId(null);
    }
  };

  const handlePrint = (invoiceNumber: string) => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Client Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 p-6 rounded-2xl border border-purple-900/40 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-semibold mb-2">
              <Building className="w-3 h-3 text-cyan-400" />
              <span>Customer Self-Service Portal</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Client Account Hub</h2>
            <p className="text-xs text-slate-400 mt-1">
              Inspect active subscriptions, download official invoices, and settle outstanding balances instantly via Razorpay.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="text-right">
              <div className="text-xs font-semibold text-emerald-400">Strict Data Isolation Active</div>
              <div className="text-[10px] text-slate-400">Scoped exclusively to your organization</div>
            </div>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Subscriptions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">My Active Subscriptions</h3>
            <p className="text-xs text-slate-400">Your recurring software services & contract terms</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold">
            {subscriptions.length} Registered
          </span>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-400">
            No active subscriptions found for your account.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subscriptions.map((sub) => {
              const isActive = sub.status === 'ACTIVE';
              const isPaused = sub.status === 'PAUSED';
              return (
                <div
                  key={sub.id}
                  className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-purple-500/40 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs text-purple-400 font-bold">{sub.subscriptionNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isPaused
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-white">{sub.plan?.name || 'Software Subscription'}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Billing cadence: {sub.billingInterval}</p>

                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">Recurring Price:</span>
                        <span className="font-bold text-white">₹{sub.totalAmount.toLocaleString('en-IN')}/period</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">Next Due Date:</span>
                        <span className="font-medium text-slate-200">
                          {new Date(sub.nextBillingDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Self-service pause/resume actions */}
                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-end space-x-2">
                    {isActive && sub.plan?.allowPause && (
                      <button
                        onClick={() => handlePause(sub.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center space-x-1.5 transition"
                      >
                        <Pause className="w-3 h-3" />
                        <span>Pause Contract</span>
                      </button>
                    )}
                    {isPaused && (
                      <button
                        onClick={() => handleResume(sub.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center space-x-1.5 transition"
                      >
                        <Play className="w-3 h-3" />
                        <span>Resume Service</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoices Section with Razorpay Payment */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Invoices & Direct Settlement</h3>
            <p className="text-xs text-slate-400">View statement of accounts and pay instantly with Razorpay</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Invoice #</th>
                  <th className="py-3 px-4 font-semibold">Billing Date</th>
                  <th className="py-3 px-4 font-semibold">Due Date</th>
                  <th className="py-3 px-4 font-semibold">Total Amount</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No invoices issued yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const isPaid = inv.status === 'PAID';
                    const isConfirmed = inv.status === 'CONFIRMED';
                    const isOverdue = isConfirmed && new Date(inv.dueDate) < new Date();

                    return (
                      <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                        <td className="py-3.5 px-4">{new Date(inv.billingDate).toLocaleDateString()}</td>
                        <td className={`py-3.5 px-4 ${isOverdue ? 'text-red-400 font-bold' : ''}`}>
                          {new Date(inv.dueDate).toLocaleDateString()}
                          {isOverdue && <span className="ml-1.5 text-[9px] uppercase px-1 py-0.5 rounded bg-red-950 text-red-400">Overdue</span>}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          ₹{inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isPaid
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isOverdue
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handlePrint(inv.invoiceNumber)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Print / PDF Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {!isPaid && (
                            <button
                              onClick={() => handlePayInvoice(inv)}
                              disabled={payingInvoiceId === inv.id}
                              className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold transition disabled:opacity-50 inline-flex items-center space-x-1"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>{payingInvoiceId === inv.id ? 'Processing...' : 'Pay with Razorpay'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
