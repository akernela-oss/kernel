import { Injectable } from '@nestjs/common';
import { ALERT } from '../../domain/constants';
import { EngineService } from '../../engine/engine.service';

@Injectable()
export class DashboardService {
  constructor(private readonly engine: EngineService) {}

  async overview(now: Date = new Date()) {
    const [bundle, config] = await Promise.all([
      this.engine.getBundle(now),
      this.engine.getSettingsAndFormulas(),
    ]);
    const k = bundle.kpis;
    const { targets } = config.formulas;

    const alerts = bundle.sales
      .filter((s) => s.risk > 0 || s.alert !== ALERT.NORMAL)
      .sort((a, b) => b.risk - a.risk);

    const productMap: Record<string, number> = {};
    for (const s of bundle.sales) {
      productMap[s.category] = (productMap[s.category] ?? 0) + s.total;
    }

    return {
      kpis: k,
      hero: [
        { label: 'ریسک کل', value: k.riskScore },
        { label: 'کیفیت KPI', value: k.quality },
        { label: 'سفارش بحرانی', value: k.criticalOrders },
        { label: 'قرارداد ناقص', value: k.incompleteContracts },
      ],
      alerts,
      charts: {
        finance: [
          { label: 'دریافت', value: k.received },
          { label: 'مانده', value: k.customerBalance },
          { label: 'بدهی', value: k.debtBalance },
          { label: 'سرمایه', value: k.invested },
          { label: 'پورسانت', value: k.commissionBalance },
        ],
        products: Object.entries(productMap).map(([label, value]) => ({ label, value })),
        quality: [
          { label: 'کیفیت KPI', value: k.quality },
          {
            label: 'Achievement',
            value: targets.revenue ? Math.min(100, (k.salesTotal / targets.revenue) * 100) : 0,
          },
          { label: 'Risk Load', value: k.riskScore },
          {
            label: 'Balance Load',
            value: targets.maxCustomerBalance
              ? Math.min(100, (k.customerBalance / targets.maxCustomerBalance) * 100)
              : 0,
          },
        ],
        commission: bundle.members.map((m) => ({
          name: m.name,
          generated: m.generated,
          paid: m.paid,
          balance: m.balance,
        })),
      },
    };
  }
}
