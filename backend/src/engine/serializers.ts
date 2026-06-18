/**
 * Serializers convert Prisma rows (Decimal, Date) into the plain,
 * JSON-friendly domain shapes used by both the engine and the API responses.
 * Defining them once keeps storage and presentation in lock-step.
 */
import {
  Account as PAccount,
  Check as PCheck,
  Customer as PCustomer,
  Debt as PDebt,
  Expense as PExpense,
  FinanceDefinition as PFinanceDefinition,
  Investment as PInvestment,
  KpiDefinition as PKpiDefinition,
  Member as PMember,
  Sale as PSale,
  Transaction as PTransaction,
} from '@prisma/client';
import { code, dateToIso, toNumber } from '../common/util/convert';

export const serializeAccount = (a: PAccount) => ({
  id: a.id,
  code: code('ACC', a.seq),
  name: a.name,
  type: a.type,
  opening: toNumber(a.opening),
  createdAt: a.createdAt.toISOString(),
});

export const serializeCustomer = (c: PCustomer) => ({
  id: c.id,
  code: code('CUS', c.seq),
  name: c.name,
  phone: c.phone,
  city: c.city,
  source: c.source,
  status: c.status,
  nextAction: c.nextAction,
  ownerId: c.ownerId,
  createdAt: c.createdAt.toISOString(),
});

export const serializeMember = (m: PMember) => ({
  id: m.id,
  code: code('MEM', m.seq),
  name: m.name,
  role: m.role,
  commissionRate: m.commissionRate,
  status: m.status,
});

export const serializeSale = (s: PSale) => ({
  id: s.id,
  code: code('ORD', s.seq),
  customerId: s.customerId,
  memberId: s.memberId,
  date: dateToIso(s.date),
  category: s.category,
  model: s.model,
  quantity: s.quantity,
  marketPrice: toNumber(s.marketPrice),
  discount: s.discount,
  contractNo: s.contractNo,
  contractStatus: s.contractStatus,
  deliveryDate: dateToIso(s.deliveryDate),
  orderStatus: s.orderStatus,
  nextAction: s.nextAction,
});

export const serializeTransaction = (t: PTransaction) => ({
  id: t.id,
  code: code('TRX', t.seq),
  date: dateToIso(t.date),
  accountId: t.accountId,
  type: t.type,
  party: t.party,
  customerId: t.customerId,
  memberId: t.memberId,
  orderId: t.orderId,
  debtId: t.debtId,
  investmentId: t.investmentId,
  inflow: toNumber(t.inflow),
  outflow: toNumber(t.outflow),
  method: t.method,
  checkId: t.checkId,
  note: t.note,
});

export const serializeCheck = (c: PCheck) => ({
  id: c.id,
  code: code('CHK', c.seq),
  type: c.type,
  transactionId: c.transactionId,
  refId: c.refId,
  party: c.party,
  bank: c.bank,
  number: c.number,
  issueDate: dateToIso(c.issueDate),
  dueDate: dateToIso(c.dueDate),
  amount: toNumber(c.amount),
  status: c.status,
});

export const serializeExpense = (e: PExpense) => ({
  id: e.id,
  code: code('EXP', e.seq),
  title: e.title,
  category: e.category,
  monthlyAmount: toNumber(e.monthlyAmount),
  dueDay: e.dueDay,
  owner: e.owner,
  status: e.status,
});

export const serializeDebt = (d: PDebt) => ({
  id: d.id,
  code: code('DEBT', d.seq),
  creditor: d.creditor,
  type: d.type,
  description: d.description,
  principal: toNumber(d.principal),
  dueDate: dateToIso(d.dueDate),
  status: d.status,
  createdAt: d.createdAt.toISOString(),
});

export const serializeInvestment = (i: PInvestment) => ({
  id: i.id,
  code: code('INV', i.seq),
  title: i.title,
  source: i.source,
  startDate: dateToIso(i.startDate),
  currentValue: toNumber(i.currentValue),
  status: i.status,
  exitTarget: dateToIso(i.exitTarget),
});

export const serializeKpiDefinition = (k: PKpiDefinition) => ({
  id: k.id,
  code: code('KPI', k.seq),
  title: k.title,
  group: k.group,
  metric: k.metric,
  target: k.target,
  direction: k.direction as 'higher' | 'lower',
  unit: k.unit,
  warning: k.warning,
  critical: k.critical,
  visibility: k.visibility,
});

export const serializeFinanceDefinition = (f: PFinanceDefinition) => ({
  id: f.id,
  code: f.code,
  type: f.type,
  title: f.title,
  group: f.group,
  formula: f.formula,
  status: f.status,
  ownerRole: f.ownerRole,
});
