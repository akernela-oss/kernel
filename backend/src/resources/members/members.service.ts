import { Injectable } from '@nestjs/common';
import { Member } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CrudService, ModelDelegate } from '../../common/services/crud.service';
import { filterPaginate } from '../../common/util/list';
import { EngineService } from '../../engine/engine.service';
import { serializeMember } from '../../engine/serializers';
import { PrismaService } from '../../prisma/prisma.service';

type SerializedMember = ReturnType<typeof serializeMember>;

@Injectable()
export class MembersService extends CrudService<Member, SerializedMember> {
  protected searchFields = ['name', 'role', 'status'];

  constructor(
    private readonly prisma: PrismaService,
    engine: EngineService,
  ) {
    super(engine);
  }

  protected get delegate(): ModelDelegate<Member> {
    return this.prisma.member;
  }

  protected serialize(row: Member): SerializedMember {
    return serializeMember(row);
  }

  /** Derived list with generated / paid / outstanding commission. */
  async listDerived(dto: PaginationDto) {
    const bundle = await this.engine.getBundle();
    return filterPaginate(bundle.members as unknown as Record<string, unknown>[], dto, [
      'name',
      'role',
      'status',
      'code',
    ]);
  }
}
