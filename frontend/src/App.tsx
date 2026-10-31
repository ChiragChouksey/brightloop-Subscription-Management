import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { CustomerPortal } from './pages/dashboard/CustomerPortal';
import { ProductList } from './pages/products/ProductList';
import { PlanList } from './pages/plans/PlanList';
import { QuotationList } from './pages/quotations/QuotationList';
import { SubscriptionList } from './pages/subscriptions/SubscriptionList';
import { InvoiceList } from './pages/invoices/InvoiceList';
import { TaxDiscountManagement } from './pages/taxes/TaxDiscountManagement';
import { PaymentList } from './pages/payments/PaymentList';
import { FinancialReports } from './pages/reports/FinancialReports';
import { UserManagement } from './pages/users/UserManagement';

export const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');
  const [resetToken, setResetToken] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Unauthenticated auth screens
  if (!user) {
    if (authView === 'register') {
      return <Register onNavigate={(v) => setAuthView(v as any)} />;
    }
    if (authView === 'forgot-password') {
      return (
        <ForgotPassword
          onNavigate={(v, token) => {
            if (token) setResetToken(token);
            setAuthView(v as any);
          }}
        />
      );
    }
    if (authView === 'reset-password') {
      return <ResetPassword token={resetToken} onNavigate={(v) => setAuthView(v as any)} />;
    }
    return <Login onNavigate={(v) => setAuthView(v as any)} />;
  }

  // Default customer to their portal
  const effectiveTab = user.role === 'CUSTOMER' && currentTab === 'dashboard' ? 'customer-portal' : currentTab;

  const renderActiveTab = () => {
    switch (effectiveTab) {
      case 'dashboard':
        return <AdminDashboard onNavigateTab={setCurrentTab} />;
      case 'products':
        return <ProductList />;
      case 'plans':
        return <PlanList />;
      case 'quotations':
        return <QuotationList />;
      case 'subscriptions':
        return <SubscriptionList />;
      case 'invoices':
        return <InvoiceList />;
      case 'taxes-discounts':
        return <TaxDiscountManagement />;
      case 'payments':
        return <PaymentList />;
      case 'reports':
        return <FinancialReports />;
      case 'users':
        return <UserManagement />;
      case 'customer-portal':
      case 'customer-invoices':
        return <CustomerPortal />;
      case 'customer-profile':
        return (
          <div className="p-8 max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-white">Company Profile & Account Details</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Company / Organization</span>
                  <p className="text-white font-bold text-sm">{user.companyName || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Account Administrator</span>
                  <p className="text-white font-bold text-sm">{user.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Primary Email</span>
                  <p className="text-purple-400 font-mono">{user.email}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Phone</span>
                  <p className="text-white">{user.phone || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <AdminDashboard onNavigateTab={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Fixed Sidebar */}
      <Sidebar currentTab={effectiveTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 ml-72 flex flex-col min-h-screen">
        <Header currentTab={effectiveTab} onRefresh={() => setRefreshKey((k) => k + 1)} />
        <main className="flex-1 pb-16" key={refreshKey}>
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
};

export default AppContent;
