import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role, User } from '@prisma/client';
// Default import works whether bcryptjs is loaded as CommonJS or ESM.
import bcrypt from 'bcryptjs';
import { code } from '../common/util/convert';
import { paginate, PaginatedResult, PaginationDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export type PublicUser = {
  id: string;
  code: string;
  name: string;
  username: string;
  role: Role;
  active: boolean;
  createdAt: string;
};

@Injectable()
export class UsersService {
  private readonly rounds: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.rounds = config.get<number>('bcryptRounds', 10);
  }

  static toPublic(user: User): PublicUser {
    return {
      id: user.id,
      code: code('USR', user.seq),
      name: user.name,
      username: user.username,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
    };
  }

  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  findRawById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.rounds);
  }

  verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async findAll(dto: PaginationDto): Promise<PaginatedResult<PublicUser>> {
    const where = dto.search
      ? {
          OR: [
            { name: { contains: dto.search, mode: 'insensitive' as const } },
            { username: { contains: dto.search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { seq: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(rows.map(UsersService.toPublic), total, dto);
  }

  async findOne(id: string): Promise<PublicUser> {
    const user = await this.findRawById(id);
    if (!user) throw new NotFoundException('کاربر یافت نشد.');
    return UsersService.toPublic(user);
  }

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        username: dto.username,
        passwordHash: await this.hash(dto.password),
        role: dto.role,
        active: dto.active ?? true,
      },
    });
    return UsersService.toPublic(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.password !== undefined) data.passwordHash = await this.hash(dto.password);
    const user = await this.prisma.user.update({ where: { id }, data });
    return UsersService.toPublic(user);
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { id, deleted: true };
  }
}
