import {
  IsEmail,
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserStatusEnum } from '../enums/user-status.enum';

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  lastName!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message: 'username may only contain letters, numbers, underscores and dots',
  })
  username!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'password must contain uppercase, lowercase and a number or symbol',
  })
  password!: string;

  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'invalid phone number' })
  phoneNumber!: string;

  @IsEnum(UserStatusEnum)
  status!: UserStatusEnum;
}
