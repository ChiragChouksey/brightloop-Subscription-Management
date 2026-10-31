import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Package, Plus, Sparkles, Tag, Layers, CheckCircle2, AlertCircle, Edit2, Trash2 } from 'lucide-react';

export const ProductList: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('SOFTWARE');
  const [salesPrice, setSalesPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [brand, setBrand] = useState('Brightloop');
  const [notes, setNotes] = useState('');
  const [variantName, setVariantName] = useState('');
  const [variantAdjustment, setVariantAdjustment] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts();
      if (res.success) setProducts(res.products);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleBrandChange = (newBrand: string) => {
    setBrand(newBrand);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // PDF rule: Selecting Odoo brand adds 560 to price
      const brandAdjustment = brand.toLowerCase() === 'odoo' ? 560 : 0;

      const variants = variantName ? [{ name: variantName, priceAdjustment: Number(variantAdjustment || 0) }] : [];

      const res = await api.createProduct({
        name,
        type,
        salesPrice: Number(salesPrice),
        costPrice: Number(costPrice || 0),
        brand,
        brandPriceAdjustment: brandAdjustment,
        notes,
        variants,
      });

      if (res.success) {
        setMessage('Product registered successfully.');
        setShowModal(false);
        // Reset form
        setName('');
        setSalesPrice('');
        setCostPrice('');
        setVariantName('');
        setVariantAdjustment('');
        setNotes('');
        fetchProducts();
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate or remove this product?')) return;
    try {
      const res = await api.deleteProduct(id);
      if (res.success) {
        setMessage(res.message);
        fetchProducts();
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
          <h2 className="text-xl font-bold text-white tracking-tight">Products & Software Catalog</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage software editions, add-ons, and brand-based price additions (e.g. Odoo +₹560).
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((p) => {
          const isOdoo = p.brand?.toLowerCase() === 'odoo';
          const finalPrice = p.salesPrice + (p.brandPriceAdjustment || 0);

          return (
            <div
              key={p.id}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-purple-500/40 transition flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase tracking-wider">
                    {p.type}
                  </span>

                  {p.brand && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isOdoo
                          ? 'bg-purple-900/60 text-purple-300 border border-purple-500/50'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
                      }`}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {p.brand} {isOdoo && '(+₹560)'}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.notes || 'No description provided.'}</p>

                {/* Price Display */}
                <div className="mt-4 pt-4 border-t border-slate-800/80">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-bold text-white">₹{finalPrice.toLocaleString('en-IN')}</span>
                      {isOdoo && (
                        <div className="text-[10px] text-purple-400">
                          Base: ₹{p.salesPrice} + Brand Fee: ₹{p.brandPriceAdjustment}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">Cost: ₹{p.costPrice}</span>
                  </div>
                </div>

                {/* Variants preview */}
                {p.variants && p.variants.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/60">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span>Configured Variants ({p.variants.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.variants.map((v) => (
                        <span key={v.id} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                          {v.name} {v.priceAdjustment > 0 && `(+₹${v.priceAdjustment})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                    title="Deactivate / Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Register New Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Brightloop Analytics Suite"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="ADDON">ADDON</option>
                    <option value="SERVICE">SERVICE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Brand</label>
                  <select
                    value={brand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Brightloop">Brightloop (Native)</option>
                    <option value="Odoo">Odoo (Adds ₹560 per PDF spec)</option>
                    <option value="ThirdParty">ThirdParty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sales Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(e.target.value)}
                    placeholder="4999"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="1200"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Brand addition notification */}
              {brand.toLowerCase() === 'odoo' && (
                <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-300 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>PDF Rule Active: Selecting Odoo adds ₹560 automatically to product price.</span>
                </div>
              )}

              {/* Variant creation */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300">Add Product Variant (Optional)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                    placeholder="Variant name (e.g. Pro)"
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="number"
                    value={variantAdjustment}
                    onChange={(e) => setVariantAdjustment(e.target.value)}
                    placeholder="+Price (e.g. 1500)"
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catalog internal notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white h-16 resize-none"
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
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-900/40"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
