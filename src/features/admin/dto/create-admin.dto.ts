import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAdminDto {
  @IsNotEmpty({ message: 'Username is required' })
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString(null)
  phone: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;
}
