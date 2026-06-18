import { NotFoundException } from '@nestjs/common';
import { EngineService } from '../../engine/engine.service';
import { paginate, PaginatedResult, PaginationDto } from '../dto/pagination.dto';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Minimal structural view of a Prisma model delegate. */
export interface ModelDelegate<Row> {
  findMany(args?: any): Promise<Row[]>;
  findUnique(args: any): Promise<Row | null>;
  create(args: any): Promise<Row>;
  update(args: any): Promise<Row>;
  delete(args: any): Promise<Row>;
  count(args?: any): Promise<number>;
}

/**
 * Reusable CRUD foundation shared by every resource service. It standardises
 * pagination, search, not-found handling and — crucially — cache invalidation
 * so that any write keeps the aggregate engine results consistent.
 */
export abstract class CrudService<Row extends { id: string }, Serialized> {
  protected abstract get delegate(): ModelDelegate<Row>;
  protected abstract serialize(row: Row): Serialized;
  protected searchFields: string[] = [];
  protected orderBy: any = { seq: 'desc' };

  protected constructor(protected readonly engine: EngineService) {}

  protected buildWhere(dto: PaginationDto): any {
    const term = dto.search?.trim();
    if (!term || this.searchFields.length === 0) return {};
    return {
      OR: this.searchFields.map((field) => ({
        [field]: { contains: term, mode: 'insensitive' },
      })),
    };
  }

  async findAll(dto: PaginationDto): Promise<PaginatedResult<Serialized>> {
    const where = this.buildWhere(dto);
    const [rows, total] = await Promise.all([
      this.delegate.findMany({ where, skip: dto.skip, take: dto.limit, orderBy: this.orderBy }),
      this.delegate.count({ where }),
    ]);
    return paginate(
      rows.map((row) => this.serialize(row)),
      total,
      dto,
    );
  }

  async findOne(id: string): Promise<Serialized> {
    const row = await this.delegate.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('رکورد یافت نشد.');
    return this.serialize(row);
  }

  async create(data: any): Promise<Serialized> {
    const row = await this.delegate.create({ data });
    this.engine.invalidate();
    return this.serialize(row);
  }

  async update(id: string, data: any): Promise<Serialized> {
    await this.findOne(id);
    const row = await this.delegate.update({ where: { id }, data });
    this.engine.invalidate();
    return this.serialize(row);
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    await this.findOne(id);
    await this.delegate.delete({ where: { id } });
    this.engine.invalidate();
    return { id, deleted: true };
  }
}
