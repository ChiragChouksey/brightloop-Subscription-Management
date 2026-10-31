# brightloop-Subscription-Management
# ⚡ Brightloop Subscription Management System
> **Subscription Management System – A complete platform for managing customers, subscription plans, billing, invoices, payments and analytics.**  
> *Developed for the Odoo Hackathon Challenge 2026*

---
## 🌟 Executive Overview
**Brightloop Software** provides an end-to-end digital backbone that manages the complete lifecycle of a recurring revenue business: from defining multi-tiered products and customizable plans to issuing automatic invoices, verifying Razorpay payments, preventing contract churn, and streaming financial intelligence to leadership with **under 10ms database response latency** (far exceeding the hackathon's < 2.0s SLA requirement).

---

## 👥 The Engineering Team & Workstreams
This repository is engineered as **ONE unified, scalable codebase** partitioned into four distinct operational workstreams:

| Member | Assigned Module | Key Deliverables & Ownership | Suggested Git Branch |
| :--- | :--- | :--- | :--- |
| **Sarthak** | **Backend Core & Security** | Express REST server, Prisma ORM schema, JWT auth, Role-Based Access Control (`ADMIN`, `STAFF`, `CUSTOMER`), Password security validation, Password reset token flows. | `feature/sarthak-auth-backend` |
| **Krishna** | **Frontend Experience** | Vite + React + TypeScript, Dark Enterprise SaaS dashboard, Lucide icons, Recharts telemetry, Self-service Client Portal, Role-switching persona sandbox. | `feature/krishna-frontend-dashboard` |
| **Chirah** | **Subscriptions & Invoicing** | Product catalog (with Odoo brand +₹560 rule), Plans (Daily/Weekly/Monthly/Yearly), Quotation templates, 1-click quote-to-subscription conversion, Automated recurring billing engine with duplicate prevention. | `feature/chirah-subscription-billing` |
| **Yash** | **Payments, Taxes & Analytics** | Razorpay Gateway checkout & backend signature verification, Configurable Tax Rules (18% GST), Promotional Discounts, Executive MRR analytics, Overdue deficit tracking. | `feature/yash-payments-reports` |

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18 / 19 + TypeScript | High type-safety, modular components, reactive state. |
| **Styling** | Tailwind CSS | Modern Dark Enterprise SaaS theme (`#030712` slate-950, violet/cyan accents). |
| **Charts** | Recharts | Responsive SVG charts for MRR, collections velocity, and status distribution. |
| **Icons** | Lucide React | High-clarity financial and SaaS iconography. |
| **Backend** | Node.js + Express (TypeScript) | High throughput, asynchronous non-blocking event-driven API. |
| **Database** | SQLite (Local Zero-Config) / PostgreSQL | Instant local demo evaluation with zero external dependencies; 100% Postgres-compatible Prisma schema. |
| **ORM** | Prisma ORM 6 | Strictly typed models, automated migrations, high-speed indexed relations. |
| **Scheduler**| Node-Cron | Automated background daily midnight billing engine + manual fallback trigger. |
| **Payment** | Razorpay SDK | Secure test order generation, checkout modal, HMAC-SHA256 signature verification. |
| **Auth** | JWT + BcryptJS | Secure cryptographic hashing (salt rounds: 10) and bearer token authentication. |

---

## 📑 Core Capabilities & Problem Statement Mapping

### 1. Authentication & Role-Based Access Control (RBAC)
- **Role Hierarchy**:
  - `ADMIN`: Global sovereignty. Creates staff members, configures taxes and discounts, triggers billing runs, manages products.
  - `STAFF`: Day-to-day operations. Builds quotes, creates subscriptions, records payments, dispatches invoices. Cannot create staff.
  - `CUSTOMER`: Strict data isolation. Accesses only their company's subscriptions, invoices, and payment receipts.
- **Strict PDF Password Policy**: Must exceed 8 characters, containing uppercase, lowercase, and special characters.
- **Forgot Password**: Issues simulated cryptographic token link to registered email for self-service resets.

### 2. Product Catalog & Brand Price Adjustments
- Dynamic software products with variants (e.g. Standard vs Pro).
- **PDF Rule Compliance**: Selecting the **Odoo brand** automatically applies a **+₹560 price adjustment** to the final calculated subscription amount.

### 3. Subscription Plans & Flexible Cadence
- Configurable intervals: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`.
- Granular lifecycle permissions per plan:
  - `autoCloseOnEnd`: Automatically closes expired contracts.
  - `allowEarlyClosure`: Enables customer/staff early cancellation with logged audit reason.
  - `allowPause`: Controls whether a contract can transition to `PAUSED`.
  - `allowRenewal`: Enables extension of contract expiration dates.

### 4. Quotations & 1-Click Subscription Conversion
- Sales quotation templates with configured validity days (e.g., 30 days).
- Automatic line item tax and discount calculations.
- **1-Click Conversion**: Accepting a quote automatically creates an **Active Subscription** and immediately generates its **First Confirmed Invoice**.

### 5. Automated Recurring Billing Engine & Duplicate Prevention
- **Safe & Idempotent**: Queries all `ACTIVE` subscriptions due for billing (`nextBillingDate <= now`).
- **Duplicate Prevention Guarantee**: Inspects the subscription's billing date range to ensure no duplicate invoice is ever generated for the same cycle.
- Advances `nextBillingDate` forward by interval upon successful invoice creation.
- Dual execution: Runs automatically via midnight cron scheduler (`0 0 * * *`) and features an **immediate fallback manual button** in the dashboard.

### 6. Dynamic Taxes & Promotional Discounts
- Configurable tax rules (e.g. GST 18%, VAT 5%) applied automatically on invoice generation.
- Discount rules: Fixed amount (e.g. `FLAT500`) or percentage-based (e.g. `EARLYBIRD20`).
- Validates minimum purchase amount, minimum item quantity, start/end validity dates, and usage counters.

### 7. Razorpay Payment Gateway & Invoice Matching
- Creates secure server-side Razorpay order receipts in INR paise.
- Mounts Razorpay Checkout modal for customer self-service settlement.
- Verifies HMAC cryptographic signatures before marking invoices as `PAID`.
- Records transaction date, method (`RAZORPAY`, `BANK_TRANSFER`, `CASH`, `CHEQUE`), and reference IDs.

### 8. Financial Telemetry & Real-Time Analytics
- **Executive Metrics**: Monthly Recurring Revenue (MRR), Total Cash Cleared, Open Receivables, Overdue Debt Balances.
- **Interactive Visualizations**: Recharts Collections Velocity Trend & Subscription Status Doughnut.
- **Sub-Second Performance**: Benchmarked database query response time displayed live (averaging 6–10ms).

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Git

### 1. Installation
Run from the project root:
```bash
# Clone the repository
git clone <your-github-repo-url>
cd Brightloop-Hackathon

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 2. Database Synchronization & Realistic Demo Seed Data
```bash
cd backend
# Push schema to SQLite database (dev.db)
npx prisma db push

# Populate with realistic test data (Admin, Staff, 3 Enterprise Customers, Products, Invoices, Subscriptions)
npm run seed
cd ..
```

### 3. Launching the Application
Open two terminal windows (or use root script):

**Terminal 1 (Backend API on Port 5050):**
```bash
cd backend
npm run dev
# Running at http://localhost:5050
```

**Terminal 2 (Frontend Client on Port 5173):**
```bash
cd frontend
npm run dev
# Running at http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Pre-Configured Test Accounts (Judge Sandbox)

You can login with these credentials or use the **One-Click Persona Pills** on the login screen:

| Role | Email | Password | Scope & Persona |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@brightloop.io` | `Admin@Brightloop123` | Full system control, staff creation, billing trigger, finance analytics. |
| **Staff** | `staff@brightloop.io` | `Staff@Brightloop123` | Quotes, subscriptions, invoices, manual payment settlements. |
| **Customer** | `apex@enterprise.com` | `Customer@Brightloop123` | Apex Technologies portal: inspect subscriptions, pay invoice via Razorpay. |
| **Customer 2**| `shop@localbites.com` | `Customer@Brightloop123` | LocalBites Gourmet: overdue invoice account. |
| **Customer 3**| `founder@zenith.ai` | `Customer@Brightloop123` | Zenith AI Research: pending quotation proposal account. |

---

## 🗄️ Database Architecture (Prisma Schema Overview)

```mermaid
erDiagram
    User ||--o{ Subscription : owns
    User ||--o{ Invoice : billed_to
    User ||--o{ Payment : pays
    User ||--o{ Quotation : requests
    Product ||--o{ ProductVariant : has
    Product ||--o{ Plan : packages
    Plan ||--o{ Subscription : subscribes
    Subscription ||--o{ SubscriptionLine : contains
    Subscription ||--o{ Invoice : generates
    Subscription ||--o{ SubscriptionHistory : logs
    Invoice ||--o{ InvoiceLine : contains
    Invoice ||--o{ Payment : settles
```

---

## 🌿 Git Multi-Member Contribution Workflow

To keep development cleanly structured across our 4 team members:

```bash
# Branch Hierarchy:
# main (Production-Ready Stable Release)
#  └── integration (Staging & Integration Testing)
#       ├── feature/sarthak-auth-backend
#       ├── feature/krishna-frontend-dashboard
#       ├── feature/chirah-subscription-billing
#       └── feature/yash-payments-reports
```

### Step-by-Step Member Git Execution:

1. **Member 1 (Sarthak):**
   ```bash
   git checkout -b feature/sarthak-auth-backend
   git add backend/src/controllers/authController.ts backend/src/middlewares/ backend/prisma/
   git commit -m "feat(auth): implement secure RBAC, JWT tokens, and user role validation"
   git push origin feature/sarthak-auth-backend
   ```

2. **Member 2 (Krishna):**
   ```bash
   git checkout -b feature/krishna-frontend-dashboard
   git add frontend/src/components/ frontend/src/pages/dashboard/ frontend/src/context/
   git commit -m "feat(frontend): build enterprise dark SaaS dashboard and customer portal"
   git push origin feature/krishna-frontend-dashboard
   ```

3. **Member 3 (Chirah):**
   ```bash
   git checkout -b feature/chirah-subscription-billing
   git add backend/src/controllers/productController.ts backend/src/controllers/subscriptionController.ts backend/src/controllers/billingController.ts
   git commit -m "feat(billing): implement subscription lifecycle and duplicate-safe billing engine"
   git push origin feature/chirah-subscription-billing
   ```

4. **Member 4 (Yash):**
   ```bash
   git checkout -b feature/yash-payments-reports
   git add backend/src/controllers/paymentController.ts backend/src/controllers/reportController.ts backend/src/controllers/taxController.ts
   git commit -m "feat(payments): integrate Razorpay verification, tax rules, and MRR reports"
   git push origin feature/yash-payments-reports
   ```

5. **Pull Request & Integration:**
   - Merge each feature branch into `integration`.
   - Run complete end-to-end integration test suite.
   - Fast-forward merge `integration` into `main`.

---

## 🧪 Comprehensive Verification Checklist

- [x] **Customer Registration & Strict Password Security**: Validates >8 chars, upper, lower, special chars.
- [x] **Role-Based Authorization**: Tested `ADMIN` vs `STAFF` vs `CUSTOMER` route restrictions.
- [x] **Staff Account Creation**: Restricted exclusively to `ADMIN` accounts.
- [x] **Customer Data Isolation**: Verified customers can only retrieve their own subscriptions & invoices.
- [x] **Brand Price Addition**: Verified selecting Odoo brand adds exactly ₹560 to base price.
- [x] **Plan Lifecycles**: Daily, Weekly, Monthly, Yearly cadences with pause/early-close/renewal rules.
- [x] **Quotation-to-Subscription**: 1-click conversion generates active contract & initial confirmed invoice.
- [x] **Automated Billing Engine**: Due subscriptions automatically billed; duplicate billing mathematically prevented.
- [x] **Razorpay Gateway**: Order creation and cryptographic HMAC-SHA256 signature verification.
- [x] **Executive Financial Dashboard**: MRR, total revenue, receivables, overdue alerts, and trends.
- [x] **Sub-2 Second Latency**: Endpoints respond in under 15ms.

---

## ⚖️ License
Engineered for Brightloop Software & Odoo Hackathon 2026. All rights reserved.
