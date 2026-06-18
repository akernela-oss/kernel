import { DEFAULT_FORMULAS, DEFAULT_SETTINGS } from './constants';
import {
  buildAlertQueue,
  computeKpis,
  computeMetricValues,
  daysUntil,
  deriveAccounts,
  deriveChecks,
  deriveCustomers,
  deriveDebts,
  deriveInvestments,
  deriveMembers,
  deriveSales,
  evaluateKpi,
} from './engine';
import { EngineData, KpiDefinition } from './types';

const NOW = new Date(2026, 5, 18); // 2026-06-18 (local midnight)

function makeData(): EngineData {
  return {
    settings: { ...DEFAULT_SETTINGS },
    formulas: JSON.parse(JSON.stringify(DEFAULT_FORMULAS)),
    accounts: [{ id: 'ACC1', name: 'Main', type: 'بانکی', opening: 100_000_000 }],
    customers: [
      { id: 'C1', name: 'A', status: 'فعال' },
      { id: 'C2', name: 'B', status: 'VIP' },
    ],
    members: [{ id: 'M1', name: 'Seller', role: 'فروشنده', commissionRate: 0.02, status: 'فعال' }],
    sales: [
      {
        id: 'S1',
        customerId: 'C1',
        memberId: 'M1',
        category: 'آیفون',
        model: 'iPhone',
        quantity: 1,
        marketPrice: 100_000_000,
        discount: 0.1,
        contractStatus: 'امضا شده',
        deliveryDate: '2026-07-30',
        orderStatus: 'ثبت شده',
      },
      {
        id: 'S2',
        customerId: 'C2',
        memberId: 'M1',
        category: 'سامسونگ',
        model: 'Galaxy',
        quantity: 2,
        marketPrice: 50_000_000,
        discount: 0.2,
        contractStatus: 'ناقص',
        deliveryDate: '2026-06-20',
        orderStatus: 'تحویل شده',
      },
    ],
    transactions: [
      {
        id: 'T1',
        accountId: 'ACC1',
        type: 'دریافت از مشتری',
        orderId: 'S1',
        customerId: 'C1',
        inflow: 40_000_000,
        outflow: 0,
        method: 'نقدی',
      },
      {
        id: 'T2',
        accountId: 'ACC1',
        type: 'پرداخت پورسانت',
        memberId: 'M1',
        inflow: 0,
        outflow: 1_000_000,
        method: 'حواله بانکی',
      },
      {
        id: 'T3',
        accountId: 'ACC1',
        type: 'پرداخت بدهی',
        debtId: 'D1',
        inflow: 0,
        outflow: 30_000_000,
        method: 'حواله بانکی',
      },
      {
        id: 'T4',
        accountId: 'ACC1',
        type: 'سرمایه‌گذاری',
        investmentId: 'I1',
        inflow: 0,
        outflow: 20_000_000,
        method: 'حواله بانکی',
      },
      {
        id: 'T5',
        accountId: 'ACC1',
        type: 'سرمایه‌گذاری',
        investmentId: 'I3',
        inflow: 0,
        outflow: 10_000_000,
        method: 'حواله بانکی',
      },
    ],
    checks: [
      {
        id: 'CH1',
        type: 'دریافتی',
        party: 'A',
        number: '1',
        dueDate: '2026-06-22',
        amount: 200_000_000,
        status: 'در انتظار وصول',
      },
      {
        id: 'CH2',
        type: 'دریافتی',
        party: 'A',
        number: '2',
        dueDate: '2026-06-01',
        amount: 30_000_000,
        status: 'وصول شده',
      },
      {
        id: 'CH3',
        type: 'پرداختی',
        party: 'X',
        number: '3',
        dueDate: '2026-06-10',
        amount: 50_000_000,
        status: 'ثبت شده',
      },
      {
        id: 'CH4',
        type: 'دریافتی',
        party: 'Y',
        number: '4',
        dueDate: '2026-06-15',
        amount: 80_000_000,
        status: 'برگشت خورده',
      },
      {
        id: 'CH5',
        type: 'دریافتی',
        party: 'Z',
        number: '5',
        dueDate: '2026-06-30',
        amount: 10_000_000,
        status: 'ثبت شده',
      },
      {
        id: 'CH6',
        type: 'دریافتی',
        party: 'W',
        number: '6',
        dueDate: '2026-08-01',
        amount: 15_000_000,
        status: 'ثبت شده',
      },
    ],
    expenses: [
      {
        id: 'E1',
        title: 'اجاره',
        category: 'اداری',
        monthlyAmount: 12_000_000,
        dueDay: 10,
        status: 'فعال',
      },
    ],
    debts: [
      {
        id: 'D1',
        creditor: 'Sup',
        type: 'تامین‌کننده',
        principal: 50_000_000,
        dueDate: '2026-06-27',
        status: 'فعال',
      },
      {
        id: 'D2',
        creditor: 'Bank',
        type: 'بانکی',
        principal: 10_000_000,
        dueDate: '2026-06-20',
        status: 'فعال',
      },
      {
        id: 'D3',
        creditor: 'Old',
        type: 'تامین‌کننده',
        principal: 8_000_000,
        dueDate: '2026-06-10',
        status: 'فعال',
      },
    ],
    investments: [
      {
        id: 'I1',
        title: 'Short',
        currentValue: 25_000_000,
        status: 'فعال',
        exitTarget: '2026-07-30',
      },
      {
        id: 'I2',
        title: 'Idle',
        currentValue: 0,
        status: 'در انتظار تصمیم',
        exitTarget: '2026-06-10',
      },
      { id: 'I3', title: 'Bad', currentValue: 5_000_000, status: 'فعال', exitTarget: '2026-07-30' },
    ],
  };
}

describe('daysUntil', () => {
  it('counts days to a future date', () => expect(daysUntil('2026-06-20', NOW)).toBe(2));
  it('is zero for today', () => expect(daysUntil('2026-06-18', NOW)).toBe(0));
  it('is negative for the past', () => expect(daysUntil('2026-06-10', NOW)).toBe(-8));
  it('returns a sentinel for missing dates', () => expect(daysUntil(null, NOW)).toBe(9999));
  it('returns a sentinel for invalid dates', () => expect(daysUntil('not-a-date', NOW)).toBe(9999));
});

describe('deriveSales', () => {
  const sales = deriveSales(makeData(), NOW);
  const s1 = sales.find((s) => s.id === 'S1')!;
  const s2 = sales.find((s) => s.id === 'S2')!;

  it('computes unit/total/commission from price, discount and quantity', () => {
    expect(s1.unit).toBe(90_000_000);
    expect(s1.total).toBe(90_000_000);
    expect(s1.commission).toBe(1_800_000);
    expect(s2.total).toBe(80_000_000);
  });
  it('derives paid and balance from linked transactions', () => {
    expect(s1.paid).toBe(40_000_000);
    expect(s1.balance).toBe(50_000_000);
    expect(s2.paid).toBe(0);
  });
  it('classifies delivery alerts and risk', () => {
    expect(s1.alert).toBe('عادی');
    expect(s1.risk).toBe(20); // balance only
    expect(s1.priority).toBe('عادی');
    expect(s2.alert).toBe('بحرانی');
    expect(s2.risk).toBe(70); // critical 30 + balance 20 + contract 20
    expect(s2.priority).toBe('بالا');
  });
});

describe('deriveAccounts', () => {
  it('balance equals opening + inflow - outflow', () => {
    const [acc] = deriveAccounts(makeData());
    expect(acc.inflow).toBe(40_000_000);
    expect(acc.outflow).toBe(61_000_000);
    expect(acc.balance).toBe(79_000_000);
  });
});

describe('deriveMembers', () => {
  it('aggregates generated/paid/balance commission', () => {
    const data = makeData();
    const m = deriveMembers(data, deriveSales(data, NOW))[0];
    expect(m.generated).toBe(3_400_000);
    expect(m.paid).toBe(1_000_000);
    expect(m.balance).toBe(2_400_000);
    expect(m.orderCount).toBe(2);
    expect(m.gross).toBe(170_000_000);
  });
});

describe('deriveCustomers', () => {
  it('rolls up orders and labels risk', () => {
    const data = makeData();
    const customers = deriveCustomers(data, deriveSales(data, NOW));
    const c1 = customers.find((c) => c.id === 'C1')!;
    const c2 = customers.find((c) => c.id === 'C2')!;
    expect(c1.total).toBe(90_000_000);
    expect(c1.balance).toBe(50_000_000);
    expect(c1.riskLabel).toBe('عادی');
    expect(c2.riskLabel).toBe('بحرانی');
  });
});

describe('deriveChecks', () => {
  const checks = deriveChecks(makeData(), NOW);
  const get = (id: string) => checks.find((c) => c.id === id)!;
  it('classifies every check status', () => {
    expect(get('CH1').alert).toBe('بحرانی'); // due in 4 days
    expect(get('CH2').alert).toBe('عادی'); // cleared
    expect(get('CH3').alert).toBe('عقب افتاده'); // overdue
    expect(get('CH4').alert).toBe('بحرانی'); // bounced
    expect(get('CH5').alert).toBe('نزدیک'); // due in 12 days
    expect(get('CH6').alert).toBe('عادی'); // far away
  });
});

describe('deriveDebts', () => {
  const debts = deriveDebts(makeData(), NOW);
  const get = (id: string) => debts.find((d) => d.id === id)!;
  it('computes balance and alerts', () => {
    expect(get('D1').paid).toBe(30_000_000);
    expect(get('D1').balance).toBe(20_000_000);
    expect(get('D1').alert).toBe('نزدیک'); // 9 days
    expect(get('D2').alert).toBe('بحرانی'); // 2 days
    expect(get('D3').alert).toBe('معوق'); // overdue
  });
});

describe('deriveInvestments', () => {
  const inv = deriveInvestments(makeData(), NOW);
  const get = (id: string) => inv.find((i) => i.id === id)!;
  it('computes invested/profit/roi and alerts', () => {
    expect(get('I1').invested).toBe(20_000_000);
    expect(get('I1').profit).toBe(5_000_000);
    expect(get('I1').roi).toBeCloseTo(0.25);
    expect(get('I1').alert).toBe('عادی');
    expect(get('I2').alert).toBe('نیازمند تصمیم'); // past exit, no value
    expect(get('I3').alert).toBe('زیان‌ده'); // negative roi
  });
});

describe('computeKpis', () => {
  const k = computeKpis(makeData(), NOW);
  it('aggregates the financial picture', () => {
    expect(k.liquidity).toBe(79_000_000);
    expect(k.salesTotal).toBe(170_000_000);
    expect(k.received).toBe(40_000_000);
    expect(k.customerBalance).toBe(130_000_000);
    expect(k.commissionBalance).toBe(2_400_000);
    expect(k.monthlyExpense).toBe(12_000_000);
    expect(k.debtBalance).toBe(38_000_000);
    expect(k.invested).toBe(30_000_000);
    expect(k.investProfit).toBe(0);
  });
  it('counts risk indicators', () => {
    expect(k.riskyChecks).toBe(3);
    expect(k.criticalOrders).toBe(1);
    expect(k.incompleteContracts).toBe(1);
    expect(k.riskScore).toBe(69); // 45 + 2*8 + 1*8
    expect(k.quality).toBe(0); // clamped at 0
  });
});

describe('computeMetricValues', () => {
  const m = computeMetricValues(makeData(), NOW);
  it('extends KPIs with rate metrics', () => {
    expect(m.collectionRate).toBeCloseTo((40_000_000 / 170_000_000) * 100);
    expect(m.activeOrders).toBe(1); // S2 is delivered
    expect(m.customerCount).toBe(2);
    expect(m.avgDiscount).toBe(15);
    expect(m.investmentROI).toBe(0);
  });
});

describe('evaluateKpi', () => {
  const metrics = computeMetricValues(makeData(), NOW);
  it('scores a higher-is-better KPI and flags critical', () => {
    const def: KpiDefinition = {
      id: 'K',
      title: 'فروش',
      group: 'مالی',
      metric: 'salesTotal',
      target: 500_000_000,
      direction: 'higher',
      unit: 'تومان',
      warning: 350_000_000,
      critical: 200_000_000,
      visibility: 'admin,finance',
    };
    const e = evaluateKpi(def, metrics);
    expect(e.value).toBe(170_000_000);
    expect(e.score).toBe(34);
    expect(e.status).toBe('بحرانی');
  });
  it('scores a lower-is-better KPI', () => {
    const def: KpiDefinition = {
      id: 'K',
      title: 'مانده',
      group: 'مالی',
      metric: 'customerBalance',
      target: 150_000_000,
      direction: 'lower',
      unit: 'تومان',
      warning: 180_000_000,
      critical: 250_000_000,
      visibility: 'admin,finance',
    };
    const e = evaluateKpi(def, metrics);
    expect(e.value).toBe(130_000_000);
    expect(e.status).toBe('عادی');
    expect(e.score).toBe(115);
  });
});

describe('buildAlertQueue', () => {
  it('collects orders, checks and debts above the alert threshold', () => {
    const rows = buildAlertQueue(makeData(), 'risk', NOW);
    expect(rows).toHaveLength(9);
    expect(rows[0].risk).toBe(100); // bounced check ranks first by risk
  });
  it('sorts by nearest delivery/due date', () => {
    const rows = buildAlertQueue(makeData(), 'delivery', NOW);
    expect(rows[0].days).toBe(-8); // most overdue first
  });
  it('sorts by largest amount', () => {
    const rows = buildAlertQueue(makeData(), 'balance', NOW);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].amount).toBeGreaterThanOrEqual(rows[i].amount);
    }
  });
  it('prioritises checks then debts by mode', () => {
    expect(buildAlertQueue(makeData(), 'checks', NOW)[0].kind).toBe('چک');
    expect(buildAlertQueue(makeData(), 'debts', NOW)[0].kind).toBe('بدهی');
  });
});

describe('cross-module invariants (everything stays connected)', () => {
  const data = makeData();
  const sales = deriveSales(data, NOW);
  const customers = deriveCustomers(data, sales);
  const k = computeKpis(data, NOW);

  it('customer totals reconcile with sales totals and KPIs', () => {
    const customerTotal = customers.reduce((t, c) => t + c.total, 0);
    const salesTotal = sales.reduce((t, s) => t + s.total, 0);
    expect(customerTotal).toBe(salesTotal);
    expect(salesTotal).toBe(k.salesTotal);
  });
  it('customer paid reconciles with received KPI', () => {
    const customerPaid = customers.reduce((t, c) => t + c.paid, 0);
    expect(customerPaid).toBe(k.received);
  });
});
