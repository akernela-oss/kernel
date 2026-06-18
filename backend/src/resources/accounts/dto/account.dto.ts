import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ example: 'حساب اصلی شرکت' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'بانکی' })
  @IsString()
  @MinLength(1)
  type!: string;

  @ApiPropertyOptional({ example: 150000000, description: 'Opening balance' })
  @IsOptional()
  @IsNumber()
  opening?: number;
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {}
