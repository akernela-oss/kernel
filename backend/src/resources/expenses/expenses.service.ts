import { Injectable } from '@nestjs/common';
import { Expense } from '@prisma/client';
import { CrudService, ModelDelegate } from '../../common/services/crud.service';
import { EngineService } from '../../engine/engine.service';
import { serializeExpense } from '../../engine/serializers';
import { PrismaService } from '../../prisma/prisma.service';

type SerializedExpense = ReturnType<typeof serializeExpense>;

@Injectable()
export class ExpensesService extends CrudService<Expense, SerializedExpense> {
  protected searchFields = ['title', 'category', 'owner', 'status'];
  protected orderBy = { seq: 'asc' as const };

  constructor(
    private readonly prisma: PrismaService,
    engine: EngineService,
  ) {
    super(engine);
  }

  protected get delegate(): ModelDelegate<Expense> {
    return this.prisma.expense;
  }

  protected serialize(row: Expense): SerializedExpense {
    return serializeExpense(row);
  }
}
