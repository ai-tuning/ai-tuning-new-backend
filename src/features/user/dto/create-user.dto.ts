import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { RolesEnum } from 'src/features/constant';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password: string;
}
