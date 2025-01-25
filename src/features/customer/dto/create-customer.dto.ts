import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserStatusEnum } from 'src/features/constant';
import { Types } from 'mongoose';

export class CreateCustomerDto {
  @IsNotEmpty()
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
  postCode: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  credits?: number;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsNotEmpty()
  @IsMongoId()
  customerType: string;

  @IsNotEmpty()
  @IsEnum(UserStatusEnum)
  status: UserStatusEnum;

  @IsOptional()
  @IsString()
  evcNumber?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  state?: string;
}
