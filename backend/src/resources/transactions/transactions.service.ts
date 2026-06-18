import { Injectable } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import { CrudService, ModelDelegate } from '../../common/services/crud.service';
import { optDate, optFk } from '../../common/util/convert';
import { EngineService } from '../../engine/engine.service';
import { serializeTransaction } from '../../engine/serializers';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';

type SerializedTransaction = ReturnType<typeof serializeTransaction>;

@Injectable()
export class TransactionsService extends CrudService<Transaction, SerializedTransaction> {
  protected searchFields = ['type', 'party', 'method', 'note'];

  constructor(
    private readonly prisma: PrismaService,
    engine: EngineService,
  ) {
    super(engine);
  }

  protected get delegate(): ModelDelegate<Transaction> {
    return this.prisma.transaction;
  }

  protected serialize(row: Transaction): SerializedTransaction {
    return serializeTransaction(row);
  }

  private mapData(dto: CreateTransactionDto | UpdateTransactionDto) {
    return {
      accountId: dto.accountId,
      type: dto.type,
      date: optDate(dto.date),
      party: dto.party,
      customerId: optFk(dto.customerId),
      memberId: optFk(dto.memberId),
      orderId: optFk(dto.orderId),
      debtId: optFk(dto.debtId),
      investmentId: optFk(dto.investmentId),
      inflow: dto.inflow,
      outflow: dto.outflow,
      method: dto.method,
      checkId: optFk(dto.checkId),
      note: dto.note,
    };
  }

  createTransaction(dto: CreateTransactionDto) {
    return this.create(this.mapData(dto));
  }

  updateTransaction(id: string, dto: UpdateTransactionDto) {
    return this.update(id, this.mapData(dto));
  }
}
