import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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
  postcode: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsNotEmpty()
  @IsString()
  countryCode?: string;

  @IsNotEmpty()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  vatNumber?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  vatRate?: number;
}
