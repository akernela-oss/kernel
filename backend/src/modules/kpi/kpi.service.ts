import { Injectable } from '@nestjs/common';
import { KpiDefinition, Role } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CrudService, ModelDelegate } from '../../common/services/crud.service';
import { METRIC_CATALOG } from '../../domain/constants';
import { EvaluatedKpi } from '../../domain/types';
import { EngineService } from '../../engine/engine.service';
import { serializeKpiDefinition } from '../../engine/serializers';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateKpiDefinitionDto, UpdateKpiDefinitionDto } from './dto/kpi-definition.dto';

type SerializedKpi = ReturnType<typeof serializeKpiDefinition>;

@Injectable()
export class KpiService extends CrudService<KpiDefinition, SerializedKpi> {
  protected searchFields = ['title', 'group', 'metric'];
  protected orderBy = { seq: 'asc' as const };

  constructor(
    private readonly prisma: PrismaService,
    engine: EngineService,
  ) {
    super(engine);
  }

  protected get delegate(): ModelDelegate<KpiDefinition> {
    return this.prisma.kpiDefinition;
  }

  protected serialize(row: KpiDefinition): SerializedKpi {
    return serializeKpiDefinition(row);
  }

  createDefinition(dto: CreateKpiDefinitionDto) {
    return this.create({
      title: dto.title,
      group: dto.group,
      metric: dto.metric,
      target: dto.target,
      direction: dto.direction,
      unit: dto.unit,
      warning: dto.warning,
      critical: dto.critical,
      visibility: dto.visibility,
    });
  }

  updateDefinition(id: string, dto: UpdateKpiDefinitionDto) {
    return this.update(id, dto);
  }

  listDefinitions(dto: PaginationDto) {
    return this.findAll(dto);
  }

  /** Available calculation sources for the KPI builder. */
  metricCatalog() {
    return METRIC_CATALOG.map(([value, label]) => ({ value, label }));
  }

  private static isVisible(def: EvaluatedKpi, role: Role): boolean {
    const r = role.toLowerCase();
    if (r === 'admin') return true;
    return (def.visibility || 'admin,finance')
      .split(',')
      .map((s) => s.trim())
      .includes(r);
  }

  /** Full KPI Studio payload: live metrics + every evaluated definition + the
   *  subset visible to the caller's role. */
  async studio(role: Role, now: Date = new Date()) {
    const [metrics, definitions] = await Promise.all([
      this.engine.getMetricValues(now),
      this.engine.evaluateDefinitions(now),
    ]);
    const visible = definitions.filter((d) => KpiService.isVisible(d, role));
    return { metrics, definitions, visible };
  }

  /** Role-visible evaluated KPIs (for the reports page). */
  async report(role: Role, now: Date = new Date()): Promise<EvaluatedKpi[]> {
    const definitions = await this.engine.evaluateDefinitions(now);
    return definitions.filter((d) => KpiService.isVisible(d, role));
  }
}
