import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class ReplaceScriptDto {
  @IsNotEmpty()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  fileService: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  scriptToReplace: string;
}
