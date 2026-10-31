import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Play, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onRefresh }) => {
  const { user } = useAuth();
  const [billingRunning, setBillingRunning] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';

  const triggerBilling = async () => {
    setBillingRunning(true);
    setBillingMessage(null);
    try {
      const res = await api.triggerBillingEngine();
      if (res.success) {
        setBillingMessage(`Billing executed: ${res.result.invoicesGenerated} invoices generated, ${res.result.subscriptionsClosed} closed.`);
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      setBillingMessage(`Billing error: ${err.message}`);
    } finally {
      setBillingRunning(false);
      setTimeout(() => setBillingMessage(null), 6000);
    }
  };

  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Executive Overview & Financial Intelligence';
      case 'products':
        return 'Product Catalog & Variant Management';
      case 'plans':
        return 'Subscription Plan Configurations';
      case 'quotations':
        return 'Quotation Templates & Customer Offers';
      case 'subscriptions':
        return 'Subscription Lifecycle & Operations';
      case 'invoices':
        return 'Invoices & Automated Recurring Billing';
      case 'taxes-discounts':
        return 'Tax Rules & Promotional Discounts';
      case 'payments':
        return 'Payment Reconciliation & Gateways';
      case 'reports':
        return 'Revenue Trends & Financial Reporting';
      case 'users':
        return 'Staff & Customer Access Control';
      case 'customer-portal':
        return 'My Active Subscriptions';
      case 'customer-invoices':
        return 'Invoices & Direct Settlement';
      case 'customer-profile':
        return 'Organization Account Profile';
      default:
        return 'Brightloop Subscription Management';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{getTitle()}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Brightloop Cloud • Logged in as <span className="text-purple-400 font-semibold">{user?.email}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {billingMessage && (
            <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg bg-purple-950/80 border border-purple-800/50 text-purple-200 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>{billingMessage}</span>
            </div>
          )}

          {isAdminOrStaff && (
            <button
              onClick={triggerBilling}
              disabled={billingRunning}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-900/30 transition disabled:opacity-50"
            >
              {billingRunning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white" />
              )}
              <span>{billingRunning ? 'Running Billing Engine...' : 'Run Billing Day Cycle'}</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Data"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
