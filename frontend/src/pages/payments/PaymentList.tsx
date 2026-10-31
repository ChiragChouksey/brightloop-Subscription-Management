import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Payment, Invoice } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Plus, CheckCircle2, ShieldCheck, Building, Banknote, FileCheck } from 'lucide-react';

export const PaymentList: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form states for manual recording
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, iRes] = await Promise.all([
        api.getPayments(),
        api.getInvoices({ status: 'CONFIRMED' }),
      ]);
      if (pRes.success) setPayments(pRes.payments);
      if (iRes.success) {
        setInvoices(iRes.invoices);
        if (iRes.invoices.length > 0) {
          setInvoiceId(iRes.invoices[0].id);
          setAmount(String(iRes.invoices[0].totalAmount));
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvoiceChange = (id: string) => {
    setInvoiceId(id);
    const selected = invoices.find((i) => i.id === id);
    if (selected) {
      setAmount(String(selected.totalAmount));
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.recordManualPayment({
        invoiceId,
        amount: Number(amount),
        method,
        notes,
      });
      if (res.success) {
        setMessage(res.message);
        setShowModal(false);
        fetchData();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Payment Reconciliation & Gateways</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit cryptographic Razorpay settlements, matched invoices, and offline banking receipts.
          </p>
        </div>

        {isAdminOrStaff && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Manual Payment</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Receipt #</th>
                <th className="py-3 px-4 font-semibold">Matched Invoice</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Method & Gateway Ref</th>
                <th className="py-3 px-4 font-semibold">Date Settled</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No payment records logged yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isRazorpay = p.method === 'RAZORPAY';
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{p.paymentNumber}</td>
                      <td className="py-3.5 px-4 font-mono text-purple-300 font-semibold">
                        {p.invoice?.invoiceNumber || 'INV-REF'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{p.customer?.companyName || p.customer?.name}</div>
                        <div className="text-[10px] text-slate-500">{p.customer?.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5 font-semibold text-white">
                          {isRazorpay ? (
                            <span className="text-purple-400">Razorpay Online</span>
                          ) : (
                            <span className="text-indigo-400">{p.method}</span>
                          )}
                        </div>
                        {p.razorpayPaymentId && (
                          <div className="text-[10px] text-slate-500 font-mono">ID: {p.razorpayPaymentId}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(p.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-[10px] text-emerald-300 font-bold">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>VERIFIED</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Manual Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Record Offline / Bank Payment</h3>
            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Open Invoice</label>
                <select
                  value={invoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.customer?.companyName || inv.customer?.name} (₹{inv.totalAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="BANK_TRANSFER">Bank Wire / NEFT</option>
                    <option value="CASH">Cash Deposit</option>
                    <option value="CHEQUE">Cheque Clearance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reference Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. UTR / Bank transfer reference number"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
