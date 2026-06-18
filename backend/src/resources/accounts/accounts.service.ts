import { Injectable } from '@nestjs/common';
import { Account } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CrudService, ModelDelegate } from '../../common/services/crud.service';
import { filterPaginate } from '../../common/util/list';
import { EngineService } from '../../engine/engine.service';
import { serializeAccount } from '../../engine/serializers';
import { PrismaService } from '../../prisma/prisma.service';

type SerializedAccount = ReturnType<typeof serializeAccount>;

@Injectable()
export class AccountsService extends CrudService<Account, SerializedAccount> {
  protected searchFields = ['name', 'type'];

  constructor(
    private readonly prisma: PrismaService,
    engine: EngineService,
  ) {
    super(engine);
  }

  protected get delegate(): ModelDelegate<Account> {
    return this.prisma.account;
  }

  protected serialize(row: Account): SerializedAccount {
    return serializeAccount(row);
  }

  /** Derived list including live balance (opening + inflow − outflow). */
  async listDerived(dto: PaginationDto) {
    const bundle = await this.engine.getBundle();
    return filterPaginate(bundle.accounts as unknown as Record<string, unknown>[], dto, [
      'name',
      'type',
      'code',
    ]);
  }
}
