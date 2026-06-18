import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Account id this transaction posts to' })
  @IsString()
  @MinLength(1)
  accountId!: string;

  @ApiProperty({ example: 'دریافت از مشتری' })
  @IsString()
  @MinLength(1)
  type!: string;

  @ApiPropertyOptional({ example: '2026-06-18' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  party?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  debtId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  investmentId?: string;

  @ApiPropertyOptional({ example: 50000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  inflow?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  outflow?: number;

  @ApiPropertyOptional({ example: 'نقدی' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ description: 'Linked check id (optional)' })
  @IsOptional()
  @IsString()
  checkId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}
