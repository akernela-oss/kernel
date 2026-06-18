/**
 * Pure calculation engine — the shared heart of the system.
 *
 * Every derived value (order totals, balances, commissions, risk scores,
 * KPIs and the alert queue) is computed here from raw data, with no I/O and
 * no framework dependencies. Services feed it database rows; the API returns
 * its output. This guarantees that all modules stay connected on exactly the
 * same basis — the formulas are defined once.
 *
 * The logic mirrors the frontend (index.html) 1:1 so results are identical.
 */
import {
  ALERT,
  CHECK_BOUNCED,
  CHECK_CLEARED,
  CONTRACT_SIGNED,
  DELIVERED_OR_CANCELLED,
  INCOMPLETE_CONTRACT_STATES,
  PRIORITY,
  TX_TYPE,
} from './constants';
import {
  AccountDerived,
  CheckDerived,
  CustomerDerived,
  DebtDerived,
  EngineData,
  EvaluatedKpi,
  InvestmentDerived,
  IsoDate,
  KpiDefinition,
  KpiSummary,
  MemberDerived,
  MetricValues,
  QueueMode,
  QueueRow,
  SaleDerived,
  Transaction,
} from './types';

// ─── Small helpers ──────────────────────────────────────────────────────────

const n = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

function sum<T>(arr: T[], pick: (item: T) => number): number {
  return arr.reduce((total, item) => total + n(pick(item)), 0);
}

function byId<T extends { id: string }>(arr: T[], id?: string | null): T | undefined {
  if (!id) return undefined;
  return arr.find((item) => item.id === id);
}

/** Days from `now` (local midnight) until `date` (local midnight). 9999 if absent. */
export function daysUntil(date: IsoDate, now: Date = new Date()): number {
  if (!date) return 9999;
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return 9999;
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((target.getTime() - base.getTime()) / 86400000);
}

function priorityFor(risk: number): string {
  if (risk >= 80) return PRIORITY.URGENT;
  if (risk >= 50) return PRIORITY.HIGH;
  if (risk >= 25) return PRIORITY.MEDIUM;
  return PRIORITY.NORMAL;
}

// ─── Derived collections ──────────────────────────────────────────────────────

export function deriveSales(data: EngineData, now: Date = new Date()): SaleDerived[] {
  const { sales, customers, members, transactions, formulas, settings } = data;
  const rw = formulas.risk;
  return sales.map((s) => {
    const customer = byId(customers, s.customerId);
    const member = byId(members, s.memberId);
    const unit = n(s.marketPrice) * (1 - n(s.discount));
    const total = unit * n(s.quantity);
    const commission = total * n(member?.commissionRate ?? 0);
    const paid = sum(
      transactions.filter(
        (t) =>
          t.orderId === s.id &&
          (t.type === TX_TYPE.CUSTOMER_RECEIPT || t.type === TX_TYPE.CUSTOMER_REFUND),
      ),
      (t) => n(t.inflow) - n(t.outflow),
    );
    const balance = total - paid;
    const dd = daysUntil(s.deliveryDate, now);
    const alert =
      dd < 0
        ? ALERT.OVERDUE
        : dd <= settings.criticalDeliveryDays
          ? ALERT.CRITICAL
          : dd <= settings.nearDeliveryDays
            ? ALERT.NEAR
            : ALERT.NORMAL;
    let risk = 0;
    risk +=
      alert === ALERT.OVERDUE
        ? rw.overdue
        : alert === ALERT.CRITICAL
          ? rw.critical
          : alert === ALERT.NEAR
            ? rw.near
            : 0;
    if (balance > 0) risk += rw.balance;
    if (s.contractStatus !== CONTRACT_SIGNED) risk += rw.contract;
    risk = Math.min(100, risk);
    return {
      ...s,
      customerName: customer?.name ?? '',
      memberName: member?.name ?? '',
      unit,
      total,
      commission,
      paid,
      balance,
      days: dd,
      alert,
      risk,
      priority: priorityFor(risk),
    };
  });
}

export function deriveAccounts(data: EngineData): AccountDerived[] {
  const { accounts, transactions } = data;
  return accounts.map((a) => {
    const related = transactions.filter((t) => t.accountId === a.id);
    const inflow = sum(related, (t) => t.inflow);
    const outflow = sum(related, (t) => t.outflow);
    return { ...a, inflow, outflow, balance: n(a.opening) + inflow - outflow };
  });
}

export function deriveMembers(data: EngineData, salesD: SaleDerived[]): MemberDerived[] {
  const { members, transactions } = data;
  return members.map((m) => {
    const ms = salesD.filter((s) => s.memberId === m.id);
    const generated = sum(ms, (s) => s.commission);
    const paid = sum(
      transactions.filter((t) => t.memberId === m.id && t.type === TX_TYPE.COMMISSION_PAYMENT),
      (t) => t.outflow,
    );
    const gross = sum(ms, (s) => s.total);
    return {
      ...m,
      gross,
      generated,
      paid,
      balance: generated - paid,
      orderCount: ms.length,
      avgSale: ms.length ? gross / ms.length : 0,
    };
  });
}

export function deriveCustomers(data: EngineData, salesD: SaleDerived[]): CustomerDerived[] {
  return data.customers.map((c) => {
    const cs = salesD.filter((s) => s.customerId === c.id);
    const total = sum(cs, (s) => s.total);
    const paid = sum(cs, (s) => s.paid);
    const balance = total - paid;
    const risk = cs.length ? Math.max(...cs.map((s) => s.risk)) : 0;
    const riskLabel =
      balance <= 0
        ? ALERT.NORMAL
        : risk >= 70
          ? ALERT.CRITICAL
          : risk >= 30
            ? ALERT.NEAR
            : ALERT.NORMAL;
    return { ...c, orderCount: cs.length, total, paid, balance, riskLabel };
  });
}

export function deriveDebts(data: EngineData, now: Date = new Date()): DebtDerived[] {
  const { debts, transactions, settings } = data;
  return debts.map((d) => {
    const paid = sum(
      transactions.filter((t) => t.debtId === d.id && t.type === TX_TYPE.DEBT_PAYMENT),
      (t) => t.outflow,
    );
    const balance = n(d.principal) - paid;
    const dd = daysUntil(d.dueDate, now);
    const alert =
      balance <= 0
        ? ALERT.SETTLED
        : dd < 0
          ? ALERT.PAST_DUE
          : dd <= settings.debtWarningDays
            ? ALERT.CRITICAL
            : dd <= 14
              ? ALERT.NEAR
              : ALERT.NORMAL;
    return { ...d, paid, balance, days: dd, alert };
  });
}

export function deriveChecks(data: EngineData, now: Date = new Date()): CheckDerived[] {
  const { checks, settings } = data;
  return checks.map((c) => {
    const dd = daysUntil(c.dueDate, now);
    const alert =
      c.status === CHECK_BOUNCED
        ? ALERT.CRITICAL
        : c.status === CHECK_CLEARED
          ? ALERT.NORMAL
          : dd < 0
            ? ALERT.OVERDUE
            : dd <= settings.checkWarningDays
              ? ALERT.CRITICAL
              : dd <= 14
                ? ALERT.NEAR
                : ALERT.NORMAL;
    return { ...c, days: dd, alert };
  });
}

export function deriveInvestments(data: EngineData, now: Date = new Date()): InvestmentDerived[] {
  const { investments, transactions } = data;
  return investments.map((i) => {
    const invested = sum(
      transactions.filter((t) => t.investmentId === i.id),
      (t) => (t.type === TX_TYPE.INVESTMENT ? n(t.outflow) : -n(t.inflow)),
    );
    const profit = n(i.currentValue) - invested;
    const roi = invested ? profit / invested : 0;
    const dd = daysUntil(i.exitTarget, now);
    const alert =
      roi < 0
        ? ALERT.LOSS
        : dd < 0
          ? ALERT.NEEDS_DECISION
          : dd <= 14
            ? ALERT.NEAR_EXIT
            : ALERT.NORMAL;
    return { ...i, invested, profit, roi, days: dd, alert };
  });
}

// ─── Aggregate KPIs ───────────────────────────────────────────────────────────

export function computeKpis(data: EngineData, now: Date = new Date()): KpiSummary {
  const salesD = deriveSales(data, now);
  const members = deriveMembers(data, salesD);
  const debts = deriveDebts(data, now);
  const checks = deriveChecks(data, now);
  const investments = deriveInvestments(data, now);
  const accounts = deriveAccounts(data);
  const { formulas, expenses } = data;

  const riskScore = Math.round(
    sum(salesD, (s) => s.risk) / Math.max(salesD.length, 1) +
      checks.filter((c) => c.alert === ALERT.CRITICAL).length * formulas.risk.checkCritical +
      debts.filter((d) => d.alert === ALERT.CRITICAL).length * formulas.risk.debtCritical,
  );
  const salesTotal = sum(salesD, (s) => s.total);
  const customerBalance = sum(salesD, (s) => Math.max(s.balance, 0));
  const quality = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (salesTotal / formulas.targets.revenue) * 100 -
          (customerBalance / formulas.targets.maxCustomerBalance) * 18 -
          (riskScore / formulas.targets.maxRiskScore) * 16,
      ),
    ),
  );

  return {
    liquidity: sum(accounts, (a) => a.balance),
    salesTotal,
    received: sum(salesD, (s) => s.paid),
    customerBalance,
    commissionBalance: sum(members, (m) => m.balance),
    monthlyExpense: sum(expenses, (e) => e.monthlyAmount),
    debtBalance: sum(debts, (d) => d.balance),
    invested: sum(investments, (i) => i.invested),
    investProfit: sum(investments, (i) => i.profit),
    riskyChecks: checks.filter((c) => c.alert === ALERT.CRITICAL || c.alert === ALERT.OVERDUE)
      .length,
    criticalOrders: salesD.filter(
      (s) => s.alert === ALERT.CRITICAL || s.alert === ALERT.OVERDUE || s.alert === ALERT.BLOCKED,
    ).length,
    incompleteContracts: salesD.filter((s) => INCOMPLETE_CONTRACT_STATES.includes(s.contractStatus))
      .length,
    riskScore,
    quality,
  };
}

export function computeMetricValues(data: EngineData, now: Date = new Date()): MetricValues {
  const k = computeKpis(data, now);
  const salesD = deriveSales(data, now);
  const investments = deriveInvestments(data, now);
  const salesTotal = k.salesTotal;
  const received = k.received;
  return {
    ...k,
    collectionRate: salesTotal ? (received / salesTotal) * 100 : 0,
    activeOrders: salesD.filter((s) => !DELIVERED_OR_CANCELLED.includes(s.orderStatus)).length,
    customerCount: data.customers.length,
    avgDiscount: salesD.length ? sum(salesD, (s) => s.discount * 100) / salesD.length : 0,
    investmentROI: k.invested ? (sum(investments, (i) => i.profit) / k.invested) * 100 : 0,
  };
}

export function evaluateKpi(def: KpiDefinition, metrics: MetricValues): EvaluatedKpi {
  const value = n((metrics as unknown as Record<string, number>)[def.metric]);
  const target = n(def.target);
  const warning = n(def.warning);
  const critical = n(def.critical);
  const dir = def.direction || 'higher';
  let status: string;
  let score: number;
  if (dir === 'higher') {
    score = target ? Math.min(140, Math.round((value / target) * 100)) : 0;
    status = value <= critical ? ALERT.CRITICAL : value <= warning ? 'هشدار' : ALERT.NORMAL;
  } else {
    score =
      target || warning
        ? Math.max(0, Math.min(140, Math.round(((target || 1) / Math.max(value, 1)) * 100)))
        : 100;
    status = value >= critical ? ALERT.CRITICAL : value >= warning ? 'هشدار' : ALERT.NORMAL;
  }
  return { ...def, value, score, status };
}

export function evaluateKpis(
  defs: KpiDefinition[],
  data: EngineData,
  now: Date = new Date(),
): EvaluatedKpi[] {
  const metrics = computeMetricValues(data, now);
  return defs.map((def) => evaluateKpi(def, metrics));
}

// ─── Alert queue ────────────────────────────────────────────────────────────

const QUEUE_SORTERS: Record<QueueMode, (a: QueueRow, b: QueueRow) => number> = {
  risk: (a, b) => b.risk - a.risk,
  delivery: (a, b) => a.days - b.days,
  balance: (a, b) => b.amount - a.amount,
  contract: (a, b) =>
    Number(a.contract === CONTRACT_SIGNED) - Number(b.contract === CONTRACT_SIGNED) ||
    b.risk - a.risk,
  checks: (a, b) =>
    Number(a.kind === 'چک' ? 0 : 1) - Number(b.kind === 'چک' ? 0 : 1) || a.days - b.days,
  debts: (a, b) =>
    Number(a.kind === 'بدهی' ? 0 : 1) - Number(b.kind === 'بدهی' ? 0 : 1) || a.days - b.days,
};

export function buildAlertQueue(
  data: EngineData,
  mode: QueueMode = 'risk',
  now: Date = new Date(),
): QueueRow[] {
  const rows: QueueRow[] = [];

  deriveSales(data, now).forEach((s) => {
    if (s.risk > 0 || s.alert !== ALERT.NORMAL) {
      rows.push({
        kind: 'سفارش',
        id: s.id,
        title: s.customerName,
        subject: s.model,
        due: s.deliveryDate,
        days: s.days,
        amount: s.balance,
        alert: s.alert,
        risk: s.risk,
        priority: s.priority,
        action: s.nextAction ?? '',
        contract: s.contractStatus,
      });
    }
  });

  deriveChecks(data, now).forEach((c) => {
    if (c.alert === ALERT.CRITICAL || c.alert === ALERT.OVERDUE || c.alert === ALERT.NEAR) {
      const risk =
        c.status === CHECK_BOUNCED
          ? 100
          : c.alert === ALERT.OVERDUE
            ? 95
            : c.alert === ALERT.CRITICAL
              ? 85
              : 45;
      rows.push({
        kind: 'چک',
        id: c.id,
        title: c.party,
        subject: `${c.bank ?? ''} / ${c.number}`,
        due: c.dueDate,
        days: c.days,
        amount: c.amount,
        alert: c.alert,
        risk,
        priority: c.alert === ALERT.NEAR ? PRIORITY.MEDIUM : PRIORITY.URGENT,
        action: 'پیگیری وصول چک',
        contract: '-',
      });
    }
  });

  deriveDebts(data, now).forEach((d) => {
    if (d.alert === ALERT.CRITICAL || d.alert === ALERT.PAST_DUE || d.alert === ALERT.NEAR) {
      const risk = d.alert === ALERT.PAST_DUE ? 95 : d.alert === ALERT.CRITICAL ? 80 : 42;
      rows.push({
        kind: 'بدهی',
        id: d.id,
        title: d.creditor,
        subject: d.description ?? '',
        due: d.dueDate,
        days: d.days,
        amount: d.balance,
        alert: d.alert,
        risk,
        priority: d.alert === ALERT.NEAR ? PRIORITY.MEDIUM : PRIORITY.URGENT,
        action: 'بررسی پرداخت بدهی',
        contract: '-',
      });
    }
  });

  const sorter = QUEUE_SORTERS[mode] ?? QUEUE_SORTERS.risk;
  return rows.sort(sorter);
}

// ─── Convenience bundle (computed once, reused by aggregate endpoints) ─────────

export interface ComputedBundle {
  sales: SaleDerived[];
  accounts: AccountDerived[];
  members: MemberDerived[];
  customers: CustomerDerived[];
  debts: DebtDerived[];
  checks: CheckDerived[];
  investments: InvestmentDerived[];
  kpis: KpiSummary;
  metrics: MetricValues;
}

export function computeAll(data: EngineData, now: Date = new Date()): ComputedBundle {
  const sales = deriveSales(data, now);
  return {
    sales,
    accounts: deriveAccounts(data),
    members: deriveMembers(data, sales),
    customers: deriveCustomers(data, sales),
    debts: deriveDebts(data, now),
    checks: deriveChecks(data, now),
    investments: deriveInvestments(data, now),
    kpis: computeKpis(data, now),
    metrics: computeMetricValues(data, now),
  };
}

export { sum as _sum, byId as _byId };
export type { Transaction };
