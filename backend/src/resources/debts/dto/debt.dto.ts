import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateDebtDto {
  @ApiProperty({ example: 'تامین‌کننده A' })
  @IsString()
  @MinLength(1)
  creditor!: string;

  @ApiProperty({ example: 'تامین‌کننده' })
  @IsString()
  @MinLength(1)
  type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 180000000 })
  @IsNumber()
  @Min(0)
  principal!: number;

  @ApiProperty({ example: '2026-06-27' })
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional({ example: 'فعال' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateDebtDto extends PartialType(CreateDebtDto) {}
