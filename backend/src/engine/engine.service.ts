import { Injectable } from '@nestjs/common';
import { CacheService } from '../common/cache/cache.service';
import { toNumber } from '../common/util/convert';
import { DEFAULT_FORMULAS, DEFAULT_SETTINGS } from '../domain/constants';
import {
  buildAlertQueue,
  computeAll,
  ComputedBundle,
  computeKpis,
  computeMetricValues,
  evaluateKpi,
} from '../domain/engine';
import {
  EngineData,
  EvaluatedKpi,
  Formulas,
  KpiDefinition,
  KpiSummary,
  MetricValues,
  QueueMode,
  QueueRow,
  Settings,
} from '../domain/types';
import { PrismaService } from '../prisma/prisma.service';
import {
  serializeAccount,
  serializeCheck,
  serializeCustomer,
  serializeDebt,
  serializeExpense,
  serializeInvestment,
  serializeMember,
  serializeSale,
  serializeTransaction,
} from './serializers';

const BUNDLE_KEY = 'engine:bundle';
const DATA_KEY = 'engine:data';
const BUNDLE_TTL_MS = 3000;

/**
 * Bridges the database and the pure calculation engine.
 *
 * Loads every collection in a single parallel round-trip, maps it into the
 * plain domain shapes, and feeds the engine. Results are cached briefly and
 * invalidated on writes, so heavy aggregate endpoints stay fast under load
 * while remaining consistent.
 */
@Injectable()
export class EngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async getSettingsAndFormulas(): Promise<{ settings: Settings; formulas: Formulas }> {
    const row = await this.prisma.appSetting.findUnique({ where: { id: 'default' } });
    if (!row) {
      return {
        settings: { ...DEFAULT_SETTINGS },
        formulas: JSON.parse(JSON.stringify(DEFAULT_FORMULAS)) as Formulas,
      };
    }
    return {
      settings: {
        nearDeliveryDays: row.nearDeliveryDays,
        criticalDeliveryDays: row.criticalDeliveryDays,
        checkWarningDays: row.checkWarningDays,
        debtWarningDays: row.debtWarningDays,
      },
      formulas: {
        discountOptions: row.discountOptions,
        risk: {
          overdue: row.riskOverdue,
          critical: row.riskCritical,
          near: row.riskNear,
          balance: row.riskBalance,
          contract: row.riskContract,
          checkCritical: row.riskCheckCritical,
          debtCritical: row.riskDebtCritical,
        },
        targets: {
          revenue: toNumber(row.targetRevenue),
          maxCustomerBalance: toNumber(row.targetMaxCustomerBalance),
          maxRiskScore: row.targetMaxRiskScore,
        },
      },
    };
  }

  /** Load and map the full dataset the engine needs. */
  async loadData(): Promise<EngineData> {
    return this.cache.wrap<EngineData>(DATA_KEY, BUNDLE_TTL_MS, async () => {
      const [
        config,
        accounts,
        customers,
        members,
        sales,
        transactions,
        checks,
        expenses,
        debts,
        investments,
      ] = await Promise.all([
        this.getSettingsAndFormulas(),
        this.prisma.account.findMany(),
        this.prisma.customer.findMany(),
        this.prisma.member.findMany(),
        this.prisma.sale.findMany(),
        this.prisma.transaction.findMany(),
        this.prisma.check.findMany(),
        this.prisma.expense.findMany(),
        this.prisma.debt.findMany(),
        this.prisma.investment.findMany(),
      ]);

      return {
        settings: config.settings,
        formulas: config.formulas,
        accounts: accounts.map(serializeAccount),
        customers: customers.map(serializeCustomer),
        members: members.map(serializeMember),
        sales: sales.map(serializeSale),
        transactions: transactions.map(serializeTransaction),
        checks: checks.map(serializeCheck),
        expenses: expenses.map(serializeExpense),
        debts: debts.map(serializeDebt),
        investments: investments.map(serializeInvestment),
      };
    });
  }

  async getBundle(now: Date = new Date()): Promise<ComputedBundle> {
    const data = await this.loadData();
    return this.cache.wrap<ComputedBundle>(BUNDLE_KEY, BUNDLE_TTL_MS, () => computeAll(data, now));
  }

  async getKpis(now: Date = new Date()): Promise<KpiSummary> {
    return computeKpis(await this.loadData(), now);
  }

  async getMetricValues(now: Date = new Date()): Promise<MetricValues> {
    return computeMetricValues(await this.loadData(), now);
  }

  async getQueue(mode: QueueMode = 'risk', now: Date = new Date()): Promise<QueueRow[]> {
    return buildAlertQueue(await this.loadData(), mode, now);
  }

  /** Evaluate stored KPI definitions against the live metrics. */
  async evaluateDefinitions(now: Date = new Date()): Promise<EvaluatedKpi[]> {
    const [data, defs] = await Promise.all([
      this.loadData(),
      this.prisma.kpiDefinition.findMany({ orderBy: { seq: 'asc' } }),
    ]);
    const metrics = computeMetricValues(data, now);
    return defs.map((d) =>
      evaluateKpi(
        {
          id: d.id,
          title: d.title,
          group: d.group,
          metric: d.metric,
          target: d.target,
          direction: d.direction as 'higher' | 'lower',
          unit: d.unit,
          warning: d.warning,
          critical: d.critical,
          visibility: d.visibility,
        } as KpiDefinition,
        metrics,
      ),
    );
  }

  /** Invalidate cached aggregates — call after any mutation. */
  invalidate(): void {
    this.cache.clear();
  }
}
