import { IsEmail, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { RolesEnum } from 'src/features/constant';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password: string;

  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(RolesEnum)
  @IsString()
  role: string;

  @IsOptional()
  @IsEnum(RolesEnum)
  @IsString()
  @IsMongoId()
  admin?: Types.ObjectId;

  @IsOptional()
  @IsEnum(RolesEnum)
  @IsString()
  @IsMongoId()
  employee?: Types.ObjectId;

  @IsOptional()
  @IsEnum(RolesEnum)
  @IsString()
  @IsMongoId()
  customer?: Types.ObjectId;
}
