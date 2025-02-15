import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { SUPPORT_TYPE } from 'src/features/constant';

export class CreateSupportTicketDto {
  @IsNotEmpty()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  customer: Types.ObjectId;

  operator: Types.ObjectId;

  @IsNotEmpty()
  @IsEnum(SUPPORT_TYPE)
  supportType: SUPPORT_TYPE;

  @IsNotEmpty()
  @IsString()
  comment: string;

  file: string;
}
