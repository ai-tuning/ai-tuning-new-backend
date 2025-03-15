import { IsBoolean, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class DecodeKess3FileDto {
  @IsNotEmpty()
  @IsString()
  filePath: string;

  @IsNotEmpty()
  @IsString()
  uniqueId: string;

  @IsNotEmpty()
  @IsString()
  tempFileId: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  adminId: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  email: string;
}
export class EncodeKess3FileDto {
  @IsNotEmpty()
  @IsString()
  filePath: string;

  @IsNotEmpty()
  @IsString()
  uniqueId: string;

  @IsNotEmpty()
  @IsMongoId()
  tempFileId: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  fileType: string;

  @IsNotEmpty()
  @IsString()
  mode: string;

  @IsNotEmpty()
  @IsString()
  fileSlotGUID: string;

  @IsNotEmpty()
  @IsBoolean()
  isCVNCorrectionPossible: boolean;
}
