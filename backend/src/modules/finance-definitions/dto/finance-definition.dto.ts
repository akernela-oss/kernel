import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateFinanceDefinitionDto {
  @ApiProperty({ example: 'فرمول KPI' })
  @IsString()
  @MinLength(1)
  type!: string;

  @ApiProperty({ example: 'KPI-COLLECTION' })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({ example: 'نرخ وصول وجه' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional({ example: 'مالی' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ example: 'received / salesTotal * 100' })
  @IsOptional()
  @IsString()
  formula?: string;

  @ApiPropertyOptional({ example: 'فعال' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['finance', 'admin'], example: 'finance' })
  @IsOptional()
  @IsIn(['finance', 'admin'])
  ownerRole?: string;
}

export class UpdateFinanceDefinitionDto extends PartialType(CreateFinanceDefinitionDto) {}
