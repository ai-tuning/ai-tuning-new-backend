import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { SUPPORT_STATUS, SUPPORT_TYPE } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
export class SupportTicket {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  admin: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  customer: Types.ObjectId;

  //who resolve the ticket
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  operator: Types.ObjectId;

  @Prop({ type: String, enum: SUPPORT_TYPE, required: true })
  supportType: SUPPORT_TYPE;

  @Prop({ type: String })
  comment: string;

  @Prop({ type: String })
  file: string;

  @Prop({ type: String, default: SUPPORT_STATUS.OPEN, required: true })
  status: SUPPORT_STATUS;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
