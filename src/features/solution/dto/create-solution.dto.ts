import { Types } from 'mongoose';
import { IsArray, IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { FUEL_TYPE, MAKE_TYPE_ENUM, SOLUTION_CATEGORY } from 'src/features/constant';

export class CreateSolutionDto {
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  name: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsEnum(SOLUTION_CATEGORY)
  category: string;

  @IsNotEmpty()
  @IsArray()
  @IsEnum(FUEL_TYPE, { each: true })
  fuelTypes: string[];

  @IsNotEmpty()
  @IsArray()
  @IsEnum(MAKE_TYPE_ENUM, { each: true })
  makeTypes: string[];
}
