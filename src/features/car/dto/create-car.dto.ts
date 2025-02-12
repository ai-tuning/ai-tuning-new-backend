import { IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { MAKE_TYPE_ENUM } from 'src/features/constant';

export class CreateCarDto {
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(MAKE_TYPE_ENUM)
  makeType: string;

  logo: string;
}
