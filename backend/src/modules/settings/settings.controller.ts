import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.FINANCE)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Current settings and formulas' })
  get() {
    return this.settings.get();
  }

  @Patch()
  @ApiOperation({ summary: 'Update Formula Studio settings (drives the engine)' })
  update(@Body() dto: UpdateSettingsDto) {
    return this.settings.update(dto);
  }
}
