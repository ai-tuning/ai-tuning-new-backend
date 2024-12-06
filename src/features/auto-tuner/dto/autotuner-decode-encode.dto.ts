import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class DecodeAutoTunerFileDto {
  @IsNotEmpty()
  @IsString()
  filePath: string;

  @IsNotEmpty()
  @IsString()
  adminId: Types.ObjectId;
}
export class EncodeAutoTunerFileDto {
  @IsNotEmpty()
  @IsString()
  filePath: string;

  @IsNotEmpty()
  @IsString()
  customerId: string;

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
