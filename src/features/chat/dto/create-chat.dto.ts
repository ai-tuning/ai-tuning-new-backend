import { IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { CHAT_BELONG } from 'src/features/constant';

export class CreateChatDto {
  @IsNotEmpty()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  customer: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  sender: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  receiver: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  service: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsEnum(CHAT_BELONG)
  chatBelong: CHAT_BELONG;

  message?: string;

  file?: string;

  mimeType?: string;
}
