import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: 'اجاره دفتر' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ example: 'اداری' })
  @IsString()
  @MinLength(1)
  category!: string;

  @ApiProperty({ example: 30000000 })
  @IsNumber()
  @Min(0)
  monthlyAmount!: number;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 31 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional({ example: 'فعال' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
