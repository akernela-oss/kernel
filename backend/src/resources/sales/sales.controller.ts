import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateSaleDto, UpdateSaleDto } from './dto/sale.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.FINANCE, Role.CONTRACT)
@Controller('sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get()
  findAll(@Query() dto: PaginationDto) {
    return this.sales.listDerived(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sales.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.sales.createSale(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSaleDto) {
    return this.sales.updateSale(id, dto);
  }

  @Roles(Role.ADMIN, Role.FINANCE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sales.remove(id);
  }
}
