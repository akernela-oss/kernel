import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { QueueQueryDto } from './dto/queue-query.dto';
import { QueueService } from './queue.service';

@ApiTags('queue')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.FINANCE, Role.CONTRACT)
@Controller('queue')
export class QueueController {
  constructor(private readonly queue: QueueService) {}

  @Get()
  @ApiOperation({ summary: 'Smart alert queue, ordered by the selected strategy' })
  build(@Query() query: QueueQueryDto) {
    return this.queue.build(query.mode);
  }
}
