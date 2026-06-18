import { Injectable } from '@nestjs/common';
import { Debt } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CrudService, ModelDelegate } from '../../common/services/crud.service';
import { optDate } from '../../common/util/convert';
import { filterPaginate } from '../../common/util/list';
import { EngineService } from '../../engine/engine.service';
import { serializeDebt } from '../../engine/serializers';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDebtDto, UpdateDebtDto } from './dto/debt.dto';

type SerializedDebt = ReturnType<typeof serializeDebt>;

@Injectable()
export class DebtsService extends CrudService<Debt, SerializedDebt> {
  protected searchFields = ['creditor', 'type', 'description', 'status'];

  constructor(
    private readonly prisma: PrismaService,
    engine: EngineService,
  ) {
    super(engine);
  }

  protected get delegate(): ModelDelegate<Debt> {
    return this.prisma.debt;
  }

  protected serialize(row: Debt): SerializedDebt {
    return serializeDebt(row);
  }

  private mapData(dto: CreateDebtDto | UpdateDebtDto) {
    return {
      creditor: dto.creditor,
      type: dto.type,
      description: dto.description,
      principal: dto.principal,
      dueDate: optDate(dto.dueDate),
      status: dto.status,
    };
  }

  createDebt(dto: CreateDebtDto) {
    return this.create(this.mapData(dto));
  }

  updateDebt(id: string, dto: UpdateDebtDto) {
    return this.update(id, this.mapData(dto));
  }

  /** Derived debts with paid / outstanding balance and due alert. */
  async listDerived(dto: PaginationDto) {
    const bundle = await this.engine.getBundle();
    return filterPaginate(bundle.debts as unknown as Record<string, unknown>[], dto, [
      'creditor',
      'type',
      'description',
      'status',
      'code',
    ]);
  }
}
