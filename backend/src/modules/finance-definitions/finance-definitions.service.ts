import { Injectable } from '@nestjs/common';
import { FinanceDefinition } from '@prisma/client';
import { CrudService, ModelDelegate } from '../../common/services/crud.service';
import { EngineService } from '../../engine/engine.service';
import { serializeFinanceDefinition } from '../../engine/serializers';
import { PrismaService } from '../../prisma/prisma.service';

type SerializedFinanceDefinition = ReturnType<typeof serializeFinanceDefinition>;

@Injectable()
export class FinanceDefinitionsService extends CrudService<
  FinanceDefinition,
  SerializedFinanceDefinition
> {
  protected searchFields = ['type', 'code', 'title', 'group', 'status'];
  protected orderBy = { seq: 'asc' as const };

  constructor(
    private readonly prisma: PrismaService,
    engine: EngineService,
  ) {
    super(engine);
  }

  protected get delegate(): ModelDelegate<FinanceDefinition> {
    return this.prisma.financeDefinition;
  }

  protected serialize(row: FinanceDefinition): SerializedFinanceDefinition {
    return serializeFinanceDefinition(row);
  }
}
