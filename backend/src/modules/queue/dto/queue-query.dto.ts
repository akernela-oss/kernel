import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { QueueMode } from '../../../domain/types';

const MODES: QueueMode[] = ['risk', 'delivery', 'balance', 'contract', 'checks', 'debts'];

export class QueueQueryDto {
  @ApiPropertyOptional({ enum: MODES, default: 'risk' })
  @IsOptional()
  @IsIn(MODES)
  mode: QueueMode = 'risk';
}
