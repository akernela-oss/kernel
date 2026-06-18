import { Injectable } from '@nestjs/common';
import { Sale } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CrudService, ModelDelegate } from '../../common/services/crud.service';
import { optDate, optFk } from '../../common/util/convert';
import { filterPaginate } from '../../common/util/list';
import { EngineService } from '../../engine/engine.service';
import { serializeSale } from '../../engine/serializers';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSaleDto, UpdateSaleDto } from './dto/sale.dto';

type SerializedSale = ReturnType<typeof serializeSale>;

@Injectable()
export class SalesService extends CrudService<Sale, SerializedSale> {
  protected searchFields = ['model', 'category', 'contractNo', 'contractStatus', 'orderStatus'];

  constructor(
    private readonly prisma: PrismaService,
    engine: EngineService,
  ) {
    super(engine);
  }

  protected get delegate(): ModelDelegate<Sale> {
    return this.prisma.sale;
  }

  protected serialize(row: Sale): SerializedSale {
    return serializeSale(row);
  }

  private mapData(dto: CreateSaleDto | UpdateSaleDto) {
    return {
      customerId: dto.customerId,
      memberId: optFk(dto.memberId),
      date: optDate(dto.date),
      category: dto.category,
      model: dto.model,
      quantity: dto.quantity,
      marketPrice: dto.marketPrice,
      discount: dto.discount,
      contractNo: dto.contractNo,
      contractStatus: dto.contractStatus,
      deliveryDate: optDate(dto.deliveryDate),
      orderStatus: dto.orderStatus,
      nextAction: dto.nextAction,
    };
  }

  createSale(dto: CreateSaleDto) {
    return this.create(this.mapData(dto));
  }

  updateSale(id: string, dto: UpdateSaleDto) {
    return this.update(id, this.mapData(dto));
  }

  /** Derived orders with totals, balance, commission, risk and priority (risk-sorted). */
  async listDerived(dto: PaginationDto) {
    const bundle = await this.engine.getBundle();
    const rows = [...bundle.sales].sort((a, b) => b.risk - a.risk);
    return filterPaginate(rows as unknown as Record<string, unknown>[], dto, [
      'model',
      'category',
      'customerName',
      'memberName',
      'contractStatus',
      'orderStatus',
      'code',
    ]);
  }
}
