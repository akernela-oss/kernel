import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateMemberDto {
  @ApiProperty({ example: 'رضا احمدی' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'فروشنده' })
  @IsString()
  @MinLength(1)
  role!: string;

  @ApiPropertyOptional({ example: 0.02, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate?: number;

  @ApiPropertyOptional({ example: 'فعال' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateMemberDto extends PartialType(CreateMemberDto) {}
