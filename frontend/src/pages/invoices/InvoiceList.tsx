import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Invoice } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Receipt,
  Printer,
  Send,
  CheckCircle2,
  AlertTriangle,
  Play,
  CreditCard,
  Eye,
  Filter,
  Check,
  XCircle,
  FileText,
} from 'lucide-react';

export const InvoiceList: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.getInvoices({
        status: statusFilter || undefined,
        overdue: overdueOnly ? 'true' : undefined,
      });
      if (res.success) setInvoices(res.invoices);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, overdueOnly]);

  const handleSendInvoice = async (id: string) => {
    try {
      const res = await api.sendInvoice(id);
      if (res.success) {
        setMessage(res.message);
        fetchInvoices();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const res = await api.updateInvoiceStatus(id, 'PAID');
      if (res.success) {
        setMessage('Invoice marked as PAID.');
        fetchInvoices();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleCancelInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      const res = await api.updateInvoiceStatus(id, 'CANCELLED');
      if (res.success) {
        setMessage('Invoice cancelled.');
        fetchInvoices();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const openInvoiceDetail = async (id: string) => {
    try {
      const res = await api.getInvoice(id);
      if (res.success) {
        setSelectedInvoice(res.invoice);
      }
    } catch (err: any) {
      setMessage(`Error fetching invoice details: ${err.message}`);
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
          <h2 className="text-xl font-bold text-white tracking-tight">Invoice Records & Automated Billing</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit automatic recurring invoices, monitor overdue accounts, and issue printable tax receipts.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              overdueOnly
                ? 'bg-red-950 border-red-500 text-red-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Overdue Only
          </button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED (Open)</option>
            <option value="PAID">PAID</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Invoice #</th>
                <th className="py-3 px-4 font-semibold">Customer Account</th>
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
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No invoices matching the current filter.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const isConfirmed = inv.status === 'CONFIRMED';
                  const isOverdue = isConfirmed && new Date(inv.dueDate) < new Date();
                  const isCancelled = inv.status === 'CANCELLED';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-white flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        <span>{inv.invoiceNumber}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{inv.customer?.companyName || inv.customer?.name}</div>
                        <div className="text-[10px] text-slate-500">{inv.customer?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {new Date(inv.billingDate).toLocaleDateString()}
                      </td>
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
                              : isCancelled
                              ? 'bg-slate-800 text-slate-500'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => openInvoiceDetail(inv.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="View / Print Tax Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {isAdminOrStaff && !isPaid && !isCancelled && (
                          <>
                            <button
                              onClick={() => handleSendInvoice(inv.id)}
                              className="p-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 transition"
                              title="Send to Registered Email"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMarkPaid(inv.id)}
                              className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 transition"
                              title="Mark Paid Manually"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCancelInvoice(inv.id)}
                              className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 transition"
                              title="Cancel Invoice"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      {/* Invoice Detail & Print Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-2xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Tax Invoice</span>
                  <span className="font-mono text-purple-400">#{selectedInvoice.invoiceNumber}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Brightloop Software Technologies Pvt Ltd</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Bill To & Dates */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Billed To:</span>
                <p className="font-bold text-white text-sm">{selectedInvoice.customer?.companyName || selectedInvoice.customer?.name}</p>
                <p className="text-slate-400">{selectedInvoice.customer?.email}</p>
                {selectedInvoice.customer?.phone && <p className="text-slate-400">{selectedInvoice.customer?.phone}</p>}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Date:</span>
                  <span className="text-white font-medium">{new Date(selectedInvoice.billingDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Due:</span>
                  <span className="text-white font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-purple-400">{selectedInvoice.status}</span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Unit Price</th>
                    <th className="py-2.5 px-3">GST Rate</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {selectedInvoice.lines?.map((line) => (
                    <tr key={line.id}>
                      <td className="py-2.5 px-3 font-medium text-white">{line.description}</td>
                      <td className="py-2.5 px-3">{line.quantity}</td>
                      <td className="py-2.5 px-3">₹{line.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3">{line.taxRate}%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">₹{line.total.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Breakdown */}
            <div className="flex justify-end text-xs">
              <div className="w-64 space-y-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>₹{selectedInvoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST Taxes (18%):</span>
                  <span>₹{selectedInvoice.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount Applied:</span>
                    <span>-₹{selectedInvoice.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                  <span>Grand Total:</span>
                  <span className="text-purple-400">₹{selectedInvoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
