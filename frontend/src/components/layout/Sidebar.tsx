import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Layers,
  FileSpreadsheet,
  Repeat,
  Receipt,
  Percent,
  CreditCard,
  BarChart3,
  Users,
  LogOut,
  Shield,
  UserCheck,
  User as UserIcon,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout, switchDemoRole } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  const isStaff = user.role === 'STAFF';
  const isCustomer = user.role === 'CUSTOMER';

  const navItems = [
    ...(isAdmin || isStaff
      ? [
          { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
          { id: 'products', label: 'Products & Variants', icon: Package },
          { id: 'plans', label: 'Subscription Plans', icon: Layers },
          { id: 'quotations', label: 'Quotations & Templates', icon: FileSpreadsheet },
          { id: 'subscriptions', label: 'Subscription Lifecycle', icon: Repeat },
          { id: 'invoices', label: 'Invoices & Billing', icon: Receipt },
          ...(isAdmin
            ? [
                { id: 'taxes-discounts', label: 'Taxes & Discounts', icon: Percent },
                { id: 'payments', label: 'Payment Records', icon: CreditCard },
                { id: 'reports', label: 'Financial Analytics', icon: BarChart3 },
                { id: 'users', label: 'Team & Staff Mgmt', icon: Users },
              ]
            : [
                { id: 'payments', label: 'Payment Records', icon: CreditCard },
              ]),
        ]
      : [
          { id: 'customer-portal', label: 'My Subscriptions', icon: Repeat },
          { id: 'customer-invoices', label: 'My Invoices & Receipts', icon: Receipt },
          { id: 'customer-profile', label: 'My Company Profile', icon: UserIcon },
        ]),
  ];

  return (
    <aside className="w-72 bg-slate-950/95 border-r border-slate-800/80 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Zap className="h-5 w-5 text-cyan-400 fill-cyan-400/20" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Brightloop <span className="text-xs px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono">2026</span>
            </h1>
            <p className="text-xs text-slate-400">Subscription Engine</p>
          </div>
        </div>

        {/* Demo Switcher Quick Pill */}
        <div className="mt-4 pt-3 border-t border-slate-800/50">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Switch Demo Role (Judge Sandbox)
          </div>
          <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => switchDemoRole('ADMIN')}
              className={`py-1 rounded font-medium transition ${
                isAdmin ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => switchDemoRole('STAFF')}
              className={`py-1 rounded font-medium transition ${
                isStaff ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Staff
            </button>
            <button
              onClick={() => switchDemoRole('CUSTOMER')}
              className={`py-1 rounded font-medium transition ${
                isCustomer ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Client
            </button>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/20 text-white border border-purple-500/30 shadow-md shadow-purple-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User profile & logout footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 truncate">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md">
              {user.name.charAt(0)}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-slate-200 truncate">{user.name}</p>
              <div className="flex items-center space-x-1.5">
                <span
                  className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wide uppercase ${
                    isAdmin
                      ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                      : isStaff
                      ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/50'
                      : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50'
                  }`}
                >
                  {isAdmin && <Shield className="w-2.5 h-2.5 mr-1 text-purple-400" />}
                  {isStaff && <UserCheck className="w-2.5 h-2.5 mr-1 text-indigo-400" />}
                  {isCustomer && <UserIcon className="w-2.5 h-2.5 mr-1 text-cyan-400" />}
                  {user.role}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
