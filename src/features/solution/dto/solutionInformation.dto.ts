import { IsArray, IsMongoId, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';

class SolutionInformationItem {
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  car: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  controller: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  solution: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  content: string;
}

export class SolutionInformationDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  solutionInformation: SolutionInformationItem[];
}
