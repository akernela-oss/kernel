import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CreateFinanceDefinitionDto,
  UpdateFinanceDefinitionDto,
} from './dto/finance-definition.dto';
import { FinanceDefinitionsService } from './finance-definitions.service';

@ApiTags('finance-definitions')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.FINANCE)
@Controller('finance-definitions')
export class FinanceDefinitionsController {
  constructor(private readonly definitions: FinanceDefinitionsService) {}

  @Get()
  findAll(@Query() dto: PaginationDto) {
    return this.definitions.findAll(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.definitions.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFinanceDefinitionDto) {
    return this.definitions.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFinanceDefinitionDto) {
    return this.definitions.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.definitions.remove(id);
  }
}
