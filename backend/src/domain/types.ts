/**
 * Domain types for the calculation engine.
 *
 * These are plain, serializable shapes (numbers + ISO `YYYY-MM-DD` date strings)
 * that are intentionally decoupled from Prisma models. The service layer maps
 * database rows into these shapes, the engine computes the derived values, and
 * the API returns them. This is the single source of truth that keeps every
 * module (sales, transactions, checks, debts, investments, KPIs, alerts)
 * connected on exactly the same basis.
 */

export type IsoDate = string | null | undefined;

export interface RiskWeights {
  overdue: number;
  critical: number;
  near: number;
  balance: number;
  contract: number;
  checkCritical: number;
  debtCritical: number;
}

export interface Targets {
  revenue: number;
  maxCustomerBalance: number;
  maxRiskScore: number;
}

export interface Formulas {
  discountOptions: number[];
  risk: RiskWeights;
  targets: Targets;
}

export interface Settings {
  nearDeliveryDays: number;
  criticalDeliveryDays: number;
  checkWarningDays: number;
  debtWarningDays: number;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  opening: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  city?: string | null;
  source?: string | null;
  status: string;
  nextAction?: string | null;
  ownerId?: string | null;
}

export interface Member {
  id: string;
  name: string;
  role: string;
  commissionRate: number;
  status: string;
}

export interface Sale {
  id: string;
  customerId: string;
  memberId?: string | null;
  date?: IsoDate;
  category: string;
  model: string;
  quantity: number;
  marketPrice: number;
  discount: number;
  contractNo?: string | null;
  contractStatus: string;
  deliveryDate?: IsoDate;
  orderStatus: string;
  nextAction?: string | null;
}

export interface Transaction {
  id: string;
  date?: IsoDate;
  accountId: string;
  type: string;
  party?: string | null;
  customerId?: string | null;
  memberId?: string | null;
  orderId?: string | null;
  debtId?: string | null;
  investmentId?: string | null;
  inflow: number;
  outflow: number;
  method: string;
  checkId?: string | null;
  note?: string | null;
}

export interface Check {
  id: string;
  type: string;
  refId?: string | null;
  party: string;
  bank?: string | null;
  number: string;
  issueDate?: IsoDate;
  dueDate: IsoDate;
  amount: number;
  status: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  monthlyAmount: number;
  dueDay: number;
  owner?: string | null;
  status: string;
}

export interface Debt {
  id: string;
  creditor: string;
  type: string;
  description?: string | null;
  principal: number;
  dueDate: IsoDate;
  status: string;
}

export interface Investment {
  id: string;
  title: string;
  source?: string | null;
  startDate?: IsoDate;
  currentValue: number;
  status: string;
  exitTarget?: IsoDate;
}

export interface KpiDefinition {
  id: string;
  title: string;
  group: string;
  metric: string;
  target: number;
  direction: 'higher' | 'lower';
  unit: string;
  warning: number;
  critical: number;
  visibility: string;
}

/** Full set of raw data the engine needs to compute every derived view. */
export interface EngineData {
  settings: Settings;
  formulas: Formulas;
  accounts: Account[];
  customers: Customer[];
  members: Member[];
  sales: Sale[];
  transactions: Transaction[];
  checks: Check[];
  expenses: Expense[];
  debts: Debt[];
  investments: Investment[];
}

// ─── Derived (computed) shapes ────────────────────────────────────────────

export interface SaleDerived extends Sale {
  customerName: string;
  memberName: string;
  unit: number;
  total: number;
  commission: number;
  paid: number;
  balance: number;
  days: number;
  alert: string;
  risk: number;
  priority: string;
}

export interface AccountDerived extends Account {
  inflow: number;
  outflow: number;
  balance: number;
}

export interface MemberDerived extends Member {
  gross: number;
  generated: number;
  paid: number;
  balance: number;
  orderCount: number;
  avgSale: number;
}

export interface CustomerDerived extends Customer {
  orderCount: number;
  total: number;
  paid: number;
  balance: number;
  riskLabel: string;
}

export interface DebtDerived extends Debt {
  paid: number;
  balance: number;
  days: number;
  alert: string;
}

export interface CheckDerived extends Check {
  days: number;
  alert: string;
}

export interface InvestmentDerived extends Investment {
  invested: number;
  profit: number;
  roi: number;
  days: number;
  alert: string;
}

export interface KpiSummary {
  liquidity: number;
  salesTotal: number;
  received: number;
  customerBalance: number;
  commissionBalance: number;
  monthlyExpense: number;
  debtBalance: number;
  invested: number;
  investProfit: number;
  riskyChecks: number;
  criticalOrders: number;
  incompleteContracts: number;
  riskScore: number;
  quality: number;
}

export interface MetricValues extends KpiSummary {
  collectionRate: number;
  activeOrders: number;
  customerCount: number;
  avgDiscount: number;
  investmentROI: number;
}

export interface EvaluatedKpi extends KpiDefinition {
  value: number;
  score: number;
  status: string;
}

export interface QueueRow {
  kind: string;
  id: string;
  title: string;
  subject: string;
  due: IsoDate;
  days: number;
  amount: number;
  alert: string;
  risk: number;
  priority: string;
  action: string;
  contract: string;
}

export type QueueMode = 'risk' | 'delivery' | 'balance' | 'contract' | 'checks' | 'debts';
