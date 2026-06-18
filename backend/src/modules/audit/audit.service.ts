import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginate, PaginationDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: PaginationDto) {
    const where: Prisma.AuditLogWhereInput = dto.search
      ? {
          OR: [
            { username: { contains: dto.search, mode: 'insensitive' } },
            { path: { contains: dto.search, mode: 'insensitive' } },
            { entity: { contains: dto.search, mode: 'insensitive' } },
            { action: { contains: dto.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginate(
      rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      total,
      dto,
    );
  }
}
