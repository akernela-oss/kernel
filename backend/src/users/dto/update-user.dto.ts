import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/** All create fields are optional on update; username is immutable. */
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['username'] as const)) {}
