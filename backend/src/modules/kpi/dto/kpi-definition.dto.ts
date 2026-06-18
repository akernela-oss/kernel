import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { METRIC_KEYS } from '../../../domain/constants';

export class CreateKpiDefinitionDto {
  @ApiProperty({ example: 'نرخ وصول وجه' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ example: 'مالی' })
  @IsString()
  @MinLength(1)
  group!: string;

  @ApiProperty({ enum: METRIC_KEYS, example: 'collectionRate' })
  @IsIn(METRIC_KEYS)
  metric!: string;

  @ApiProperty({ example: 80 })
  @IsNumber()
  target!: number;

  @ApiProperty({ enum: ['higher', 'lower'], example: 'higher' })
  @IsIn(['higher', 'lower'])
  direction!: 'higher' | 'lower';

  @ApiPropertyOptional({ example: '٪' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  warning?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsNumber()
  critical?: number;

  @ApiPropertyOptional({ example: 'admin,finance' })
  @IsOptional()
  @IsString()
  visibility?: string;
}

export class UpdateKpiDefinitionDto extends PartialType(CreateKpiDefinitionDto) {}
