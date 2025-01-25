import { IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { NoticeType } from 'src/features/constant/enums/notice-type.enum';

export class UpdateNoticeDto {
  @IsNotEmpty()
  @IsMongoId()
  admin: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(NoticeType)
  noticeType: NoticeType;

  @IsNotEmpty()
  @IsDateString()
  expiration: Date;
}
