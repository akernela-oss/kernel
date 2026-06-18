import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSaleDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  customerId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ example: '2026-06-18' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ example: 'آیفون' })
  @IsString()
  @MinLength(1)
  category!: string;

  @ApiProperty({ example: 'iPhone 16 Pro Max 256GB' })
  @IsString()
  @MinLength(1)
  model!: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: 93000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  marketPrice?: number;

  @ApiPropertyOptional({ example: 0.14, minimum: 0, maximum: 0.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(0.99)
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contractNo?: string;

  @ApiPropertyOptional({ example: 'امضا شده' })
  @IsOptional()
  @IsString()
  contractStatus?: string;

  @ApiPropertyOptional({ example: '2026-06-24' })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional({ example: 'ثبت شده' })
  @IsOptional()
  @IsString()
  orderStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nextAction?: string;
}

export class UpdateSaleDto extends PartialType(CreateSaleDto) {}
