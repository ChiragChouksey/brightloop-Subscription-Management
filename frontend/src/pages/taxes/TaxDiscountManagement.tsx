import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TaxRule, DiscountRule } from '../../types';
import { Percent, Plus, Tag, Check, X, CheckCircle2, Trash2 } from 'lucide-react';

export const TaxDiscountManagement: React.FC = () => {
  const [taxes, setTaxes] = useState<TaxRule[]>([]);
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Modals
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Tax form
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Discount form
  const [discountCode, setDiscountCode] = useState('');
  const [discountDescription, setDiscountDescription] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('0');
  const [minQty, setMinQty] = useState('1');
  const [maxUsage, setMaxUsage] = useState('100');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, dRes] = await Promise.all([api.getTaxRules(), api.getDiscountRules()]);
      if (tRes.success) setTaxes(tRes.taxRules);
      if (dRes.success) setDiscounts(dRes.discounts);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createTaxRule({
        name: taxName,
        ratePercentage: Number(taxRate),
        isDefault,
      });
      if (res.success) {
        setMessage('Tax rule created successfully.');
        setShowTaxModal(false);
        setTaxName('');
        setTaxRate('');
        fetchData();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createDiscountRule({
        code: discountCode,
        description: discountDescription,
        discountType,
        value: Number(discountValue),
        minPurchaseAmount: Number(minPurchase),
        minQuantity: Number(minQty),
        maxUsageLimit: Number(maxUsage),
      });
      if (res.success) {
        setMessage('Discount rule created successfully.');
        setShowDiscountModal(false);
        setDiscountCode('');
        setDiscountValue('');
        fetchData();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleDeleteTax = async (id: string) => {
    if (!confirm('Delete tax rule?')) return;
    try {
      await api.deleteTaxRule(id);
      fetchData();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm('Delete discount rule?')) return;
    try {
      await api.deleteDiscountRule(id);
      fetchData();
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
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Taxes & Discount Rules</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configurable statutory tax categories (GST, VAT) and promotional discount campaigns.
        </p>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Tax Rules Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Configured Tax Rates</h3>
            <p className="text-xs text-slate-400">Taxes calculated dynamically on quotation and invoice generation</p>
          </div>
          <button
            onClick={() => setShowTaxModal(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center space-x-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Tax Rule</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {taxes.map((t) => (
            <div key={t.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-white text-sm">{t.name}</h4>
                  {t.isDefault && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                      DEFAULT
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-purple-400 mt-1">{t.ratePercentage}%</div>
              </div>
              <button
                onClick={() => handleDeleteTax(t.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Discount Rules Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Promotional Discount Codes</h3>
            <p className="text-xs text-slate-400">Rules applied automatically on billing cycles or customer quotations</p>
          </div>
          <button
            onClick={() => setShowDiscountModal(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Discount Rule</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {discounts.map((d) => (
            <div key={d.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-white text-base px-2.5 py-1 rounded-lg bg-slate-950 border border-purple-500/40 text-purple-300">
                    {d.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase">
                    {d.discountType === 'PERCENTAGE' ? `${d.value}% Off` : `₹${d.value} Flat`}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{d.description || 'Promotional concession.'}</p>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <div>Min Purchase: ₹{d.minPurchaseAmount} • Min Qty: {d.minQuantity}</div>
                  <div>Usage Limit: {d.currentUsageCount} / {d.maxUsageLimit} redeemed</div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteDiscount(d.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create Tax Modal */}
      {showTaxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Tax Rule</h3>
            <form onSubmit={handleCreateTax} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tax Category Name</label>
                <input
                  type="text"
                  required
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  placeholder="e.g. GST 18% or VAT 5%"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tax Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="18"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
                />
                <span>Set as default tax rule for new invoices</span>
              </label>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaxModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  Save Tax
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Discount Promo Rule</h3>
            <form onSubmit={handleCreateDiscount} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="e.g. FLASH25"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Value</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="20"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Min Purchase (₹)</label>
                  <input
                    type="number"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Usages</label>
                  <input
                    type="number"
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  value={discountDescription}
                  onChange={(e) => setDiscountDescription(e.target.value)}
                  placeholder="Quarterly customer retention promotion"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Save Discount Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
