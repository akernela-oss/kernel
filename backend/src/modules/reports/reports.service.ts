import { Injectable } from '@nestjs/common';
import { EngineService } from '../../engine/engine.service';

@Injectable()
export class ReportsService {
  constructor(private readonly engine: EngineService) {}

  async overview(now: Date = new Date()) {
    const [data, k] = await Promise.all([this.engine.loadData(), this.engine.getKpis(now)]);
    return {
      financial: [
        { label: 'نقدینگی', value: k.liquidity },
        { label: 'فروش', value: k.salesTotal },
        { label: 'دریافت', value: k.received },
        { label: 'مانده مشتری', value: k.customerBalance },
        { label: 'بدهی', value: k.debtBalance },
      ],
      operation: [
        { label: 'مشتری', value: data.customers.length },
        { label: 'سفارش', value: data.sales.length },
        { label: 'تراکنش', value: data.transactions.length },
        { label: 'چک در خطر', value: k.riskyChecks },
        { label: 'قرارداد ناقص', value: k.incompleteContracts },
      ],
      risk: [
        { label: 'ریسک کل', value: k.riskScore },
        { label: 'کیفیت KPI', value: k.quality },
        { label: 'سفارش بحرانی', value: k.criticalOrders },
        { label: 'مانده پورسانت', value: k.commissionBalance },
        { label: 'سود سرمایه', value: k.investProfit },
      ],
    };
  }
}
