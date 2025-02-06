import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateScriptDto {
  @IsNotEmpty()
  @IsString()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  car: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  controller: Types.ObjectId;

  @IsOptional()
  @IsString()
  fileService: Types.ObjectId;
}
