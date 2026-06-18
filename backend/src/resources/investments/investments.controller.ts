import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateInvestmentDto, UpdateInvestmentDto } from './dto/investment.dto';
import { InvestmentsService } from './investments.service';

@ApiTags('investments')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.FINANCE)
@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investments: InvestmentsService) {}

  @Get()
  findAll(@Query() dto: PaginationDto) {
    return this.investments.listDerived(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.investments.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateInvestmentDto) {
    return this.investments.createInvestment(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvestmentDto) {
    return this.investments.updateInvestment(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.investments.remove(id);
  }
}
