import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateCheckDto {
  @ApiProperty({ example: 'دریافتی' })
  @IsString()
  @MinLength(1)
  type!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(1)
  number!: string;

  @ApiProperty({ example: 'علی رضایی' })
  @IsString()
  @MinLength(1)
  party!: string;

  @ApiPropertyOptional({ example: 'ملت' })
  @IsOptional()
  @IsString()
  bank?: string;

  @ApiPropertyOptional({ description: 'Order / debt / transaction reference' })
  @IsOptional()
  @IsString()
  refId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiProperty({ example: '2026-06-25' })
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ example: 200000000 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ example: 'در انتظار وصول' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateCheckDto extends PartialType(CreateCheckDto) {}
