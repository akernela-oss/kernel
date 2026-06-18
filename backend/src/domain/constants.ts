/**
 * Shared domain vocabulary, default configuration and catalogs.
 * Ported 1:1 from the frontend SEED so the backend computes identical results.
 */
import { Formulas, Settings } from './types';

// ─── Transaction types ────────────────────────────────────────────────────
export const TX_TYPE = {
  CUSTOMER_RECEIPT: 'دریافت از مشتری',
  CUSTOMER_REFUND: 'برگشت وجه مشتری',
  COMMISSION_PAYMENT: 'پرداخت پورسانت',
  FIXED_COST: 'هزینه ثابت',
  DEBT_PAYMENT: 'پرداخت بدهی',
  INVESTMENT: 'سرمایه‌گذاری',
  INVESTMENT_WITHDRAW: 'برداشت از سرمایه‌گذاری',
} as const;

export const TX_TYPES: string[] = Object.values(TX_TYPE);

// ─── Alert levels ─────────────────────────────────────────────────────────
export const ALERT = {
  NORMAL: 'عادی',
  NEAR: 'نزدیک',
  CRITICAL: 'بحرانی',
  OVERDUE: 'عقب افتاده',
  BLOCKED: 'مسدود',
  SETTLED: 'تسویه شده',
  PAST_DUE: 'معوق',
  LOSS: 'زیان‌ده',
  NEEDS_DECISION: 'نیازمند تصمیم',
  NEAR_EXIT: 'نزدیک خروج',
} as const;

export const PRIORITY = {
  URGENT: 'فوری',
  HIGH: 'بالا',
  MEDIUM: 'متوسط',
  NORMAL: 'عادی',
} as const;

// ─── Contract / order vocabulary ────────────────────────────────────────────
export const CONTRACT_SIGNED = 'امضا شده';
export const INCOMPLETE_CONTRACT_STATES = ['ناقص', 'در انتظار امضا', 'ریسک حقوقی'];
export const DELIVERED_OR_CANCELLED = ['تحویل شده', 'لغو شده'];
export const CHECK_BOUNCED = 'برگشت خورده';
export const CHECK_CLEARED = 'وصول شده';

// ─── Default settings & formulas (engine fallback) ──────────────────────────
export const DEFAULT_SETTINGS: Settings = {
  nearDeliveryDays: 14,
  criticalDeliveryDays: 5,
  checkWarningDays: 7,
  debtWarningDays: 7,
};

export const DEFAULT_FORMULAS: Formulas = {
  discountOptions: [0.07, 0.14, 0.16, 0.25, 0.27, 0.29],
  risk: {
    overdue: 45,
    critical: 30,
    near: 15,
    balance: 20,
    contract: 20,
    checkCritical: 8,
    debtCritical: 8,
  },
  targets: {
    revenue: 500000000,
    maxCustomerBalance: 150000000,
    maxRiskScore: 55,
  },
};

// ─── Metric catalog (KPI source metrics) ─────────────────────────────────────
export const METRIC_CATALOG: ReadonlyArray<readonly [string, string]> = [
  ['salesTotal', 'ارزش کل فروش'],
  ['received', 'دریافت مشتری'],
  ['collectionRate', 'نرخ وصول وجه'],
  ['customerBalance', 'مانده قابل دریافت'],
  ['liquidity', 'نقدینگی کل'],
  ['commissionBalance', 'مانده پورسانت'],
  ['monthlyExpense', 'هزینه ثابت ماهانه'],
  ['debtBalance', 'بدهی مانده'],
  ['invested', 'سرمایه‌گذاری‌شده'],
  ['investmentROI', 'ROI سرمایه‌گذاری'],
  ['activeOrders', 'سفارش فعال'],
  ['customerCount', 'تعداد مشتری'],
  ['avgDiscount', 'میانگین تخفیف'],
  ['incompleteContracts', 'قرارداد ناقص'],
  ['criticalOrders', 'سفارش بحرانی'],
  ['riskyChecks', 'چک در خطر'],
  ['riskScore', 'امتیاز ریسک کل'],
  ['quality', 'کیفیت KPI'],
];

export const METRIC_KEYS: string[] = METRIC_CATALOG.map(([key]) => key);

export function metricLabel(metric: string): string {
  const found = METRIC_CATALOG.find(([key]) => key === metric);
  return found ? found[1] : metric;
}

// ─── Role → allowed pages (RBAC navigation, mirrors the frontend) ────────────
export const ROLE_PAGES: Record<string, string[]> = {
  admin: [
    'dashboard',
    'queue',
    'crm',
    'sales',
    'transactions',
    'members',
    'checks',
    'debts',
    'investments',
    'reports',
    'kpiStudio',
    'seller',
    'formula',
    'guide',
  ],
  finance: [
    'dashboard',
    'queue',
    'crm',
    'sales',
    'transactions',
    'members',
    'checks',
    'debts',
    'investments',
    'reports',
    'kpiStudio',
    'formula',
    'guide',
  ],
  seller: ['seller', 'guide'],
  contract: ['queue', 'crm', 'sales', 'guide'],
};

export const ROLE_LABELS: Record<string, string> = {
  admin: 'مدیریت کل',
  finance: 'مدیر مالی',
  seller: 'فروشنده',
  contract: 'کارشناس قرارداد',
};
