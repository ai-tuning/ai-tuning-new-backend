import { Types } from 'mongoose';
import { MAKE_TYPE_ENUM, SOLUTION_CATEGORY } from 'src/features/constant';
import { IsEnum, IsMongoId, IsNotEmpty, IsNumber } from 'class-validator';

export class CreatePricingDto {
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsEnum(MAKE_TYPE_ENUM)
  makeType: MAKE_TYPE_ENUM;

  @IsNotEmpty()
  @IsEnum(SOLUTION_CATEGORY)
  solutionCategory: SOLUTION_CATEGORY;

  @IsNotEmpty()
  @IsMongoId()
  customerType: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  solution: Types.ObjectId;
}
