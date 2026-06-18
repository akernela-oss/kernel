import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateDebtDto, UpdateDebtDto } from './dto/debt.dto';
import { DebtsService } from './debts.service';

@ApiTags('debts')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.FINANCE)
@Controller('debts')
export class DebtsController {
  constructor(private readonly debts: DebtsService) {}

  @Get()
  findAll(@Query() dto: PaginationDto) {
    return this.debts.listDerived(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.debts.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDebtDto) {
    return this.debts.createDebt(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDebtDto) {
    return this.debts.updateDebt(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.debts.remove(id);
  }
}
