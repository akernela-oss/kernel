import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.FINANCE, Role.CONTRACT, Role.SELLER)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  findAll(@Query() dto: PaginationDto, @CurrentUser() user: AuthUser) {
    return this.customers.listDerived(dto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.customers.findOneForUser(id, user);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: AuthUser) {
    return this.customers.createForUser(dto, user);
  }

  @Roles(Role.ADMIN, Role.FINANCE, Role.CONTRACT)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customers.updateCustomer(id, dto);
  }

  @Roles(Role.ADMIN, Role.FINANCE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customers.remove(id);
  }
}
