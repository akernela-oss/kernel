import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ceo' })
  @IsString()
  @MinLength(2)
  username!: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @MinLength(1)
  password!: string;
}
