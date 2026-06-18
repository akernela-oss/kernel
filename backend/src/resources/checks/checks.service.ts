import { Injectable } from '@nestjs/common';
import { Check } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CrudService, ModelDelegate } from '../../common/services/crud.service';
import { optDate, optFk } from '../../common/util/convert';
import { filterPaginate } from '../../common/util/list';
import { EngineService } from '../../engine/engine.service';
import { serializeCheck } from '../../engine/serializers';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCheckDto, UpdateCheckDto } from './dto/check.dto';

type SerializedCheck = ReturnType<typeof serializeCheck>;

@Injectable()
export class ChecksService extends CrudService<Check, SerializedCheck> {
  protected searchFields = ['type', 'party', 'bank', 'number', 'status'];

  constructor(
    private readonly prisma: PrismaService,
    engine: EngineService,
  ) {
    super(engine);
  }

  protected get delegate(): ModelDelegate<Check> {
    return this.prisma.check;
  }

  protected serialize(row: Check): SerializedCheck {
    return serializeCheck(row);
  }

  private mapData(dto: CreateCheckDto | UpdateCheckDto) {
    return {
      type: dto.type,
      number: dto.number,
      party: dto.party,
      bank: dto.bank,
      refId: dto.refId,
      transactionId: optFk(dto.transactionId),
      issueDate: optDate(dto.issueDate),
      dueDate: optDate(dto.dueDate),
      amount: dto.amount,
      status: dto.status,
    };
  }

  createCheck(dto: CreateCheckDto) {
    return this.create(this.mapData(dto));
  }

  updateCheck(id: string, dto: UpdateCheckDto) {
    return this.update(id, this.mapData(dto));
  }

  /** Derived checks with days-to-due and collection alert. */
  async listDerived(dto: PaginationDto) {
    const bundle = await this.engine.getBundle();
    return filterPaginate(bundle.checks as unknown as Record<string, unknown>[], dto, [
      'type',
      'party',
      'bank',
      'number',
      'status',
      'code',
    ]);
  }
}
