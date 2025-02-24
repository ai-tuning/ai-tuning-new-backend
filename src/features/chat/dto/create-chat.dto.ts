import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { CHAT_BELONG, CHAT_MESSAGE_SENDER_GROUP } from 'src/features/constant';

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

  @IsNotEmpty()
  @IsString()
  @IsEnum(CHAT_MESSAGE_SENDER_GROUP)
  messageSenderGroup: CHAT_MESSAGE_SENDER_GROUP;

  message?: string;

  file?: string;

  mimeType?: string;
}
