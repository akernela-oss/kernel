import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'مدیر مالی' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'finance' })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({ example: 'StrongPass123', minLength: 4 })
  @IsString()
  @MinLength(4)
  password!: string;

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role!: Role;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
