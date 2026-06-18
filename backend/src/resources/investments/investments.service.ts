import { Injectable } from '@nestjs/common';
import { Investment } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CrudService, ModelDelegate } from '../../common/services/crud.service';
import { optDate } from '../../common/util/convert';
import { filterPaginate } from '../../common/util/list';
import { EngineService } from '../../engine/engine.service';
import { serializeInvestment } from '../../engine/serializers';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvestmentDto, UpdateInvestmentDto } from './dto/investment.dto';

type SerializedInvestment = ReturnType<typeof serializeInvestment>;

@Injectable()
export class InvestmentsService extends CrudService<Investment, SerializedInvestment> {
  protected searchFields = ['title', 'status'];

  constructor(
    private readonly prisma: PrismaService,
    engine: EngineService,
  ) {
    super(engine);
  }

  protected get delegate(): ModelDelegate<Investment> {
    return this.prisma.investment;
  }

  protected serialize(row: Investment): SerializedInvestment {
    return serializeInvestment(row);
  }

  private mapData(dto: CreateInvestmentDto | UpdateInvestmentDto) {
    return {
      title: dto.title,
      source: dto.source,
      startDate: optDate(dto.startDate),
      currentValue: dto.currentValue,
      status: dto.status,
      exitTarget: optDate(dto.exitTarget),
    };
  }

  createInvestment(dto: CreateInvestmentDto) {
    return this.create(this.mapData(dto));
  }

  updateInvestment(id: string, dto: UpdateInvestmentDto) {
    return this.update(id, this.mapData(dto));
  }

  /** Derived investments with invested capital, profit, ROI and alert. */
  async listDerived(dto: PaginationDto) {
    const bundle = await this.engine.getBundle();
    return filterPaginate(bundle.investments as unknown as Record<string, unknown>[], dto, [
      'title',
      'status',
      'code',
    ]);
  }
}
