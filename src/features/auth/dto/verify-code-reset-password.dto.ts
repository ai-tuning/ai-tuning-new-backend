import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerificationCodeResetPasswordDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'Verification Code is required' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
