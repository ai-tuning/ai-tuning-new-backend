import { IsArray, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { SOLUTION_CATEGORY } from 'src/features/constant';

export class PrepareSolutionDto {
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  tempFileService: Types.ObjectId;

  @IsNotEmpty()
  @IsArray()
  selectedSolutions: Types.ObjectId[];

  @IsNotEmpty()
  @IsArray()
  selectedSolutionCategory: SOLUTION_CATEGORY[];

  @IsNotEmpty()
  @IsArray()
  selectedFiles: string[]; //those files for the selected solutions

  @IsNotEmpty()
  @IsArray()
  requestedSolutions: Types.ObjectId[];

  @IsNotEmpty()
  @IsString()
  engine: string;

  @IsNotEmpty()
  @IsString()
  power: string;

  @IsNotEmpty()
  @IsString()
  carModel: string;

  @IsNotEmpty()
  @IsString()
  year: string;

  @IsNotEmpty()
  @IsString()
  exactEcu: string;

  @IsNotEmpty()
  @IsString()
  gearbox: string;

  @IsNotEmpty()
  @IsString()
  fuel: string;

  @IsOptional()
  @IsString()
  vin: string;

  @IsOptional()
  @IsString()
  readingTool: string;

  @IsOptional()
  @IsString()
  comments: string;
}
