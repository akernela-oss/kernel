import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateKpiDefinitionDto, UpdateKpiDefinitionDto } from './dto/kpi-definition.dto';
import { KpiService } from './kpi.service';

@ApiTags('kpi')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.FINANCE)
@Controller('kpi')
export class KpiController {
  constructor(private readonly kpi: KpiService) {}

  @Get('metrics')
  metrics() {
    return this.kpi.metricCatalog();
  }

  @Get('studio')
  studio(@CurrentUser() user: AuthUser) {
    return this.kpi.studio(user.role);
  }

  @Get('report')
  report(@CurrentUser() user: AuthUser) {
    return this.kpi.report(user.role);
  }

  @Get('definitions')
  list(@Query() dto: PaginationDto) {
    return this.kpi.listDefinitions(dto);
  }

  @Get('definitions/:id')
  findOne(@Param('id') id: string) {
    return this.kpi.findOne(id);
  }

  @Post('definitions')
  create(@Body() dto: CreateKpiDefinitionDto) {
    return this.kpi.createDefinition(dto);
  }

  @Patch('definitions/:id')
  update(@Param('id') id: string, @Body() dto: UpdateKpiDefinitionDto) {
    return this.kpi.updateDefinition(id, dto);
  }

  @Delete('definitions/:id')
  remove(@Param('id') id: string) {
    return this.kpi.remove(id);
  }
}
