import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerificationEmailDto {
  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'Code is required' })
  code: string;
}
