import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateCheckDto, UpdateCheckDto } from './dto/check.dto';
import { ChecksService } from './checks.service';

@ApiTags('checks')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.FINANCE)
@Controller('checks')
export class ChecksController {
  constructor(private readonly checks: ChecksService) {}

  @Get()
  findAll(@Query() dto: PaginationDto) {
    return this.checks.listDerived(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checks.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCheckDto) {
    return this.checks.createCheck(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCheckDto) {
    return this.checks.updateCheck(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checks.remove(id);
  }
}
