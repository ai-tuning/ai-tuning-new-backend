import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  role: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
