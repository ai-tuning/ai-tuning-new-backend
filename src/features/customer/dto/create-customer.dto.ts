import { IsEmail, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { UserStatusEnum } from 'src/features/constant';
import { Types } from 'mongoose';

export class CreateCustomerDto {
  @IsOptional()
  @IsMongoId()
  admin: Types.ObjectId;

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
  @IsString(null) // Use specific locale if needed, e.g., 'US'
  phone: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @Matches(/^\d{4,6}$/, { message: 'Postcode must be between 4 and 6 digits' })
  postcode: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  credits?: number = 0;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsMongoId()
  customerType: Types.ObjectId;

  @IsOptional()
  @IsEnum(UserStatusEnum)
  status: UserStatusEnum;

  @IsOptional()
  @IsString()
  evcNumber?: string;

  @IsOptional()
  @IsString()
  vatNumber?: string;

  @IsNotEmpty()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  street?: string;

  mysqlId?: number;
}
