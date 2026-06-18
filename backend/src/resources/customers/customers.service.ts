import { ForbiddenException, Injectable } from '@nestjs/common';
import { Customer, Role } from '@prisma/client';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CrudService, ModelDelegate } from '../../common/services/crud.service';
import { filterPaginate } from '../../common/util/list';
import { optFk } from '../../common/util/convert';
import { EngineService } from '../../engine/engine.service';
import { serializeCustomer } from '../../engine/serializers';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

type SerializedCustomer = ReturnType<typeof serializeCustomer>;

@Injectable()
export class CustomersService extends CrudService<Customer, SerializedCustomer> {
  protected searchFields = ['name', 'phone', 'city', 'source', 'status', 'nextAction'];

  constructor(
    private readonly prisma: PrismaService,
    engine: EngineService,
  ) {
    super(engine);
  }

  protected get delegate(): ModelDelegate<Customer> {
    return this.prisma.customer;
  }

  protected serialize(row: Customer): SerializedCustomer {
    return serializeCustomer(row);
  }

  /** Derived list (with rolled-up totals/risk). Sellers see only their own. */
  async listDerived(dto: PaginationDto, user: AuthUser) {
    const bundle = await this.engine.getBundle();
    let rows = bundle.customers;
    if (user.role === Role.SELLER) {
      rows = rows.filter((c) => c.ownerId === user.id);
    }
    return filterPaginate(rows as unknown as Record<string, unknown>[], dto, [
      'name',
      'phone',
      'city',
      'source',
      'status',
      'nextAction',
      'code',
    ]);
  }

  /** Fetch one customer, enforcing seller ownership (prevents cross-seller access). */
  async findOneForUser(id: string, user: AuthUser): Promise<SerializedCustomer> {
    const customer = await this.findOne(id);
    if (user.role === Role.SELLER && customer.ownerId !== user.id) {
      throw new ForbiddenException('دسترسی به این مشتری مجاز نیست.');
    }
    return customer;
  }

  createForUser(dto: CreateCustomerDto, user: AuthUser) {
    const ownerId = user.role === Role.SELLER ? user.id : (dto.ownerId ?? user.id);
    return this.create({ ...dto, ownerId });
  }

  updateCustomer(id: string, dto: UpdateCustomerDto) {
    return this.update(id, { ...dto, ownerId: optFk(dto.ownerId) });
  }
}
