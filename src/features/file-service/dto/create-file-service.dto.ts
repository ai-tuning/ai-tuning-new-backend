import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { SLAVE_TYPE } from 'src/features/constant';

export class AutomatisationDto {
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  customer: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  car: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  controller: Types.ObjectId;

  @IsOptional()
  @IsString()
  @IsEnum(SLAVE_TYPE)
  slaveType: SLAVE_TYPE;
}
