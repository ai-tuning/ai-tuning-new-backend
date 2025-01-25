import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { NoticeType } from 'src/features/constant/enums/notice-type.enum';

@Schema({ versionKey: false, timestamps: true })
export class Notice extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  admin: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Date, required: true })
  expiration: Date;

  @Prop({ type: String, enum: NoticeType, required: true, default: NoticeType.SUCCESS })
  noticeType: NoticeType;
}

export class NoticeDocument {
  _id: string;
  admin: Types.ObjectId;
  content: string;
  noticeType: NoticeType;
  expiration: Date;
}

export const NoticeSchema = SchemaFactory.createForClass(Notice);
