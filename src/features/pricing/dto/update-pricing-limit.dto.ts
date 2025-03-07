import { IsEnum, IsMongoId, IsNotEmpty, IsNumber } from 'class-validator';
import { Types } from 'mongoose';
import { MAKE_TYPE_ENUM } from 'src/features/constant';

export class UpdatePricingLimitDto {
  @IsNotEmpty()
  @IsNumber()
  minPrice: number;

  @IsNotEmpty()
  @IsNumber()
  maxPrice: number;

  @IsNotEmpty()
  @IsEnum(MAKE_TYPE_ENUM)
  makeType: MAKE_TYPE_ENUM;

  @IsNotEmpty()
  @IsMongoId()
  customerType: Types.ObjectId;
}
