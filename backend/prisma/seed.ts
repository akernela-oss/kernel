/**
 * Seed the database with the demo dataset from the frontend (index.html),
 * preserving every relationship. Human-readable source ids (CUS-001, ORD-1001…)
 * are mapped to generated cuids so foreign keys stay consistent.
 *
 * Run with: `npm run prisma:seed`
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

async function clear(): Promise<void> {
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.check.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.kpiDefinition.deleteMany();
  await prisma.financeDefinition.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.member.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appSetting.deleteMany();
}

async function main(): Promise<void> {
  await clear();

  // ── Settings & formulas ───────────────────────────────────────────────
  await prisma.appSetting.create({ data: { id: 'default' } }); // all defaults match SEED

  // ── Users (password: 1234) ────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('1234', 10);
  const users = [
    { name: 'مدیر کل', username: 'ceo', role: Role.ADMIN },
    { name: 'مدیر مالی', username: 'finance', role: Role.FINANCE },
    { name: 'فروشنده یک', username: 'seller1', role: Role.SELLER },
    { name: 'کارشناس قرارداد', username: 'contract', role: Role.CONTRACT },
  ];
  const userMap = new Map<string, string>();
  for (const u of users) {
    const row = await prisma.user.create({ data: { ...u, passwordHash } });
    userMap.set(u.username, row.id);
  }
  const sellerId = userMap.get('seller1')!;

  // ── Accounts ──────────────────────────────────────────────────────────
  const accountSeed = [
    { old: 'ACC-01', name: 'حساب اصلی شرکت', type: 'بانکی', opening: 150_000_000 },
    { old: 'ACC-02', name: 'صندوق نقدی', type: 'نقدی', opening: 25_000_000 },
    { old: 'ACC-03', name: 'صندوق چک‌ها', type: 'چک', opening: 0 },
    { old: 'ACC-04', name: 'صندوق سرمایه‌گذاری', type: 'سرمایه‌گذاری', opening: 0 },
    { old: 'ACC-05', name: 'صندوق پورسانت اعضا', type: 'داخلی', opening: 0 },
    { old: 'ACC-06', name: 'صندوق بدهی و تعهدات', type: 'داخلی', opening: 0 },
  ];
  const accountMap = new Map<string, string>();
  for (const a of accountSeed) {
    const row = await prisma.account.create({
      data: { name: a.name, type: a.type, opening: a.opening },
    });
    accountMap.set(a.old, row.id);
  }

  // ── Members ───────────────────────────────────────────────────────────
  const memberSeed = [
    { old: 'MEM-001', name: 'رضا احمدی', role: 'فروشنده', commissionRate: 0.02 },
    { old: 'MEM-002', name: 'مهسا اکبری', role: 'مدیر فروش', commissionRate: 0.012 },
    { old: 'MEM-003', name: 'نیما سلیمانی', role: 'معرف', commissionRate: 0.01 },
    { old: 'MEM-004', name: 'الهام نوری', role: 'مدیر قرارداد', commissionRate: 0.006 },
  ];
  const memberMap = new Map<string, string>();
  for (const m of memberSeed) {
    const row = await prisma.member.create({
      data: { name: m.name, role: m.role, commissionRate: m.commissionRate, status: 'فعال' },
    });
    memberMap.set(m.old, row.id);
  }

  // ── Customers (all owned by seller1, mirroring migrateState) ───────────
  const customerSeed = [
    { old: 'CUS-001', name: 'علی رضایی', phone: '09120000001', city: 'تهران', source: 'اینستاگرام', status: 'فعال', nextAction: 'پیگیری تحویل آیفون' },
    { old: 'CUS-002', name: 'سارا محمدی', phone: '09120000002', city: 'اصفهان', source: 'معرف', status: 'VIP', nextAction: 'بررسی قرارداد' },
    { old: 'CUS-003', name: 'مانی کریمی', phone: '09120000003', city: 'شیراز', source: 'تبلیغات', status: 'فعال', nextAction: 'وصول چک' },
  ];
  const customerMap = new Map<string, string>();
  for (const c of customerSeed) {
    const row = await prisma.customer.create({ data: { ...rest(c), ownerId: sellerId } });
    customerMap.set(c.old, row.id);
  }

  // ── Sales ─────────────────────────────────────────────────────────────
  const saleSeed = [
    { old: 'ORD-1001', customer: 'CUS-001', member: 'MEM-001', date: '2026-06-01', category: 'آیفون', model: 'iPhone 16 Pro Max 256GB', quantity: 2, marketPrice: 93_000_000, discount: 0.14, contractNo: 'CON-1001', contractStatus: 'امضا شده', deliveryDate: '2026-06-24', orderStatus: 'ثبت شده', nextAction: 'تماس با تامین‌کننده' },
    { old: 'ORD-1002', customer: 'CUS-002', member: 'MEM-002', date: '2026-06-03', category: 'آیفون', model: 'iPhone 15 Pro 128GB', quantity: 1, marketPrice: 76_000_000, discount: 0.07, contractNo: 'CON-1002', contractStatus: 'در انتظار امضا', deliveryDate: '2026-06-20', orderStatus: 'ثبت شده', nextAction: 'تکمیل قرارداد' },
    { old: 'ORD-1003', customer: 'CUS-003', member: 'MEM-003', date: '2026-06-05', category: 'سامسونگ', model: 'Galaxy S25 Ultra 512GB', quantity: 1, marketPrice: 69_000_000, discount: 0.25, contractNo: 'CON-1003', contractStatus: 'ناقص', deliveryDate: '2026-06-18', orderStatus: 'ثبت شده', nextAction: 'پیگیری چک' },
  ];
  const saleMap = new Map<string, string>();
  for (const s of saleSeed) {
    const row = await prisma.sale.create({
      data: {
        customerId: customerMap.get(s.customer)!,
        memberId: memberMap.get(s.member)!,
        date: d(s.date),
        category: s.category,
        model: s.model,
        quantity: s.quantity,
        marketPrice: s.marketPrice,
        discount: s.discount,
        contractNo: s.contractNo,
        contractStatus: s.contractStatus,
        deliveryDate: d(s.deliveryDate),
        orderStatus: s.orderStatus,
        nextAction: s.nextAction,
      },
    });
    saleMap.set(s.old, row.id);
  }

  // ── Debts ─────────────────────────────────────────────────────────────
  const debtSeed = [
    { old: 'DEBT-001', creditor: 'تامین‌کننده A', type: 'تامین‌کننده', description: 'خرید عمده آیفون', principal: 180_000_000, dueDate: '2026-06-27' },
    { old: 'DEBT-002', creditor: 'بانک', type: 'بانکی', description: 'تسهیلات کوتاه‌مدت', principal: 120_000_000, dueDate: '2026-07-10' },
  ];
  const debtMap = new Map<string, string>();
  for (const dbt of debtSeed) {
    const row = await prisma.debt.create({
      data: {
        creditor: dbt.creditor,
        type: dbt.type,
        description: dbt.description,
        principal: dbt.principal,
        dueDate: d(dbt.dueDate),
        status: 'فعال',
      },
    });
    debtMap.set(dbt.old, row.id);
  }

  // ── Investments ───────────────────────────────────────────────────────
  const investmentSeed = [
    { old: 'INV-001', title: 'سرمایه‌گذاری کوتاه‌مدت تامین کالا', source: 'ACC-04', startDate: '2026-06-10', currentValue: 56_000_000, status: 'فعال', exitTarget: '2026-07-10' },
    { old: 'INV-002', title: 'ذخیره سود عملیاتی', source: 'ACC-04', startDate: '2026-06-12', currentValue: 0, status: 'در انتظار تصمیم', exitTarget: '2026-08-01' },
  ];
  const investmentMap = new Map<string, string>();
  for (const inv of investmentSeed) {
    const row = await prisma.investment.create({
      data: {
        title: inv.title,
        source: inv.source,
        startDate: d(inv.startDate),
        currentValue: inv.currentValue,
        status: inv.status,
        exitTarget: d(inv.exitTarget),
      },
    });
    investmentMap.set(inv.old, row.id);
  }

  // ── Checks (refId mapped to order/debt) ────────────────────────────────
  const checkSeed = [
    { old: 'CHK-1001', type: 'دریافتی', ref: 'ORD-1001', party: 'علی رضایی', bank: 'ملت', number: '123456', issueDate: '2026-06-01', dueDate: '2026-06-25', amount: 200_000_000, status: 'در انتظار وصول' },
    { old: 'CHK-1002', type: 'پرداختی', ref: 'DEBT-001', party: 'تامین‌کننده A', bank: 'ملی', number: '998877', issueDate: '2026-06-04', dueDate: '2026-06-19', amount: 80_000_000, status: 'ثبت شده' },
  ];
  const checkMap = new Map<string, string>();
  for (const c of checkSeed) {
    const refId = saleMap.get(c.ref) ?? debtMap.get(c.ref) ?? c.ref;
    const row = await prisma.check.create({
      data: {
        type: c.type,
        refId,
        party: c.party,
        bank: c.bank,
        number: c.number,
        issueDate: d(c.issueDate),
        dueDate: d(c.dueDate),
        amount: c.amount,
        status: c.status,
      },
    });
    checkMap.set(c.old, row.id);
  }

  // ── Transactions (all foreign keys mapped) ─────────────────────────────
  const txSeed = [
    { old: 'TRX-1001', date: '2026-06-01', account: 'ACC-01', type: 'دریافت از مشتری', party: 'علی رضایی', customer: 'CUS-001', order: 'ORD-1001', inflow: 50_000_000, outflow: 0, method: 'نقدی', note: 'پیش‌پرداخت' },
    { old: 'TRX-1002', date: '2026-06-01', account: 'ACC-03', type: 'دریافت از مشتری', party: 'علی رضایی', customer: 'CUS-001', order: 'ORD-1001', inflow: 200_000_000, outflow: 0, method: 'چک', check: 'CHK-1001', note: 'چک مشتری' },
    { old: 'TRX-1003', date: '2026-06-03', account: 'ACC-01', type: 'دریافت از مشتری', party: 'سارا محمدی', customer: 'CUS-002', order: 'ORD-1002', inflow: 45_000_000, outflow: 0, method: 'حواله بانکی', note: 'پرداخت اول' },
    { old: 'TRX-1004', date: '2026-06-05', account: 'ACC-01', type: 'دریافت از مشتری', party: 'مانی کریمی', customer: 'CUS-003', order: 'ORD-1003', inflow: 35_000_000, outflow: 0, method: 'کارت به کارت', note: 'پرداخت اولیه' },
    { old: 'TRX-1005', date: '2026-06-08', account: 'ACC-05', type: 'پرداخت پورسانت', party: 'رضا احمدی', member: 'MEM-001', order: 'ORD-1001', inflow: 0, outflow: 2_000_000, method: 'حواله بانکی', note: 'پورسانت مرحله اول' },
    { old: 'TRX-1006', date: '2026-06-09', account: 'ACC-01', type: 'هزینه ثابت', party: 'اجاره دفتر', inflow: 0, outflow: 30_000_000, method: 'حواله بانکی', note: 'اجاره ماهانه' },
    { old: 'TRX-1007', date: '2026-06-10', account: 'ACC-01', type: 'سرمایه‌گذاری', party: 'صندوق سرمایه‌گذاری داخلی', investment: 'INV-001', inflow: 0, outflow: 50_000_000, method: 'حواله بانکی', note: 'سرمایه‌گذاری نقدی' },
    { old: 'TRX-1008', date: '2026-06-11', account: 'ACC-06', type: 'پرداخت بدهی', party: 'تامین‌کننده A', debt: 'DEBT-001', inflow: 0, outflow: 25_000_000, method: 'حواله بانکی', note: 'تسویه بخشی بدهی تامین‌کننده' },
  ];
  const txMap = new Map<string, string>();
  for (const t of txSeed) {
    const row = await prisma.transaction.create({
      data: {
        date: d(t.date),
        accountId: accountMap.get(t.account)!,
        type: t.type,
        party: t.party,
        customerId: t.customer ? customerMap.get(t.customer) : null,
        memberId: t.member ? memberMap.get(t.member) : null,
        orderId: t.order ? saleMap.get(t.order) : null,
        debtId: t.debt ? debtMap.get(t.debt) : null,
        investmentId: t.investment ? investmentMap.get(t.investment) : null,
        inflow: t.inflow,
        outflow: t.outflow,
        method: t.method,
        checkId: t.check ? checkMap.get(t.check) : null,
        note: t.note,
      },
    });
    txMap.set(t.old, row.id);
  }

  // Back-link the receivable check to its originating transaction.
  await prisma.check.update({
    where: { id: checkMap.get('CHK-1001')! },
    data: { transactionId: txMap.get('TRX-1002')! },
  });

  // ── Expenses ──────────────────────────────────────────────────────────
  await prisma.expense.createMany({
    data: [
      { title: 'اجاره دفتر', category: 'اداری', monthlyAmount: 30_000_000, dueDay: 10, owner: 'مدیر مالی', status: 'فعال' },
      { title: 'حقوق تیم پشتیبانی', category: 'حقوق', monthlyAmount: 85_000_000, dueDay: 28, owner: 'مدیر مالی', status: 'فعال' },
      { title: 'اینترنت و نرم‌افزارها', category: 'زیرساخت', monthlyAmount: 12_000_000, dueDay: 15, owner: 'مدیر عملیات', status: 'فعال' },
    ],
  });

  // ── KPI definitions ───────────────────────────────────────────────────
  await prisma.kpiDefinition.createMany({ data: defaultKpis() });

  // ── Finance definitions ───────────────────────────────────────────────
  await prisma.financeDefinition.createMany({
    data: [
      { type: 'قانون هشدار', code: 'DELIVERY-QUEUE', title: 'صف تحویل', group: 'عملیات', formula: 'daysToDelivery + balanceRisk + contractRisk', status: 'فعال', ownerRole: 'finance' },
      { type: 'فرمول KPI', code: 'COLLECTION-RATE', title: 'نرخ وصول وجه', group: 'مالی', formula: 'received / salesTotal * 100', status: 'فعال', ownerRole: 'finance' },
    ],
  });

  const counts = {
    users: await prisma.user.count(),
    customers: await prisma.customer.count(),
    sales: await prisma.sale.count(),
    transactions: await prisma.transaction.count(),
    checks: await prisma.check.count(),
    kpis: await prisma.kpiDefinition.count(),
  };
  // eslint-disable-next-line no-console
  console.log('Seed complete:', counts);
}

function rest<T extends { old: string }>(obj: T): Omit<T, 'old'> {
  const { old: _old, ...rest } = obj;
  return rest;
}

function defaultKpis() {
  return [
    { title: 'ارزش کل فروش', group: 'مالی', metric: 'salesTotal', target: 500_000_000, direction: 'higher', unit: 'تومان', warning: 350_000_000, critical: 200_000_000, visibility: 'admin,finance' },
    { title: 'نرخ وصول وجه', group: 'مالی', metric: 'collectionRate', target: 80, direction: 'higher', unit: '٪', warning: 60, critical: 40, visibility: 'admin,finance' },
    { title: 'مانده قابل دریافت', group: 'مالی', metric: 'customerBalance', target: 150_000_000, direction: 'lower', unit: 'تومان', warning: 180_000_000, critical: 250_000_000, visibility: 'admin,finance' },
    { title: 'نقدینگی کل', group: 'مالی', metric: 'liquidity', target: 300_000_000, direction: 'higher', unit: 'تومان', warning: 180_000_000, critical: 90_000_000, visibility: 'admin,finance' },
    { title: 'مانده پورسانت', group: 'پورسانت', metric: 'commissionBalance', target: 25_000_000, direction: 'lower', unit: 'تومان', warning: 35_000_000, critical: 50_000_000, visibility: 'admin,finance' },
    { title: 'بدهی مانده', group: 'بدهی', metric: 'debtBalance', target: 200_000_000, direction: 'lower', unit: 'تومان', warning: 260_000_000, critical: 350_000_000, visibility: 'admin,finance' },
    { title: 'تعداد سفارش فعال', group: 'فروش', metric: 'activeOrders', target: 20, direction: 'higher', unit: 'عدد', warning: 10, critical: 5, visibility: 'admin,finance,seller' },
    { title: 'میانگین تخفیف', group: 'فروش', metric: 'avgDiscount', target: 20, direction: 'lower', unit: '٪', warning: 24, critical: 29, visibility: 'admin,finance' },
    { title: 'قراردادهای ناقص', group: 'قرارداد', metric: 'incompleteContracts', target: 0, direction: 'lower', unit: 'عدد', warning: 2, critical: 5, visibility: 'admin,finance,contract' },
    { title: 'سفارش‌های بحرانی', group: 'عملیات', metric: 'criticalOrders', target: 0, direction: 'lower', unit: 'عدد', warning: 2, critical: 5, visibility: 'admin,finance,contract' },
    { title: 'چک‌های در خطر', group: 'چک', metric: 'riskyChecks', target: 0, direction: 'lower', unit: 'عدد', warning: 1, critical: 3, visibility: 'admin,finance' },
    { title: 'ROI سرمایه‌گذاری', group: 'سرمایه‌گذاری', metric: 'investmentROI', target: 10, direction: 'higher', unit: '٪', warning: 3, critical: 0, visibility: 'admin,finance' },
    { title: 'کیفیت کل KPI', group: 'فرماندهی', metric: 'quality', target: 80, direction: 'higher', unit: '٪', warning: 60, critical: 40, visibility: 'admin,finance' },
    { title: 'امتیاز ریسک کل', group: 'ریسک', metric: 'riskScore', target: 55, direction: 'lower', unit: 'امتیاز', warning: 65, critical: 80, visibility: 'admin,finance' },
  ];
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
