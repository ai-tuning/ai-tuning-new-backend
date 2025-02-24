import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { FileSchema } from 'src/features/common';
import { CHAT_BELONG, CHAT_MESSAGE_SENDER_GROUP } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
class Chat extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  admin: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  customer: Types.ObjectId;

  //user id who send the message
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  sender: Types.ObjectId;

  //admin or customer
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  receiver: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  service: Types.ObjectId;

  @Prop({ type: String, enum: CHAT_BELONG, required: true })
  chatBelong: CHAT_BELONG;

  @Prop({ type: String, enum: CHAT_MESSAGE_SENDER_GROUP, required: true })
  messageSenderGroup: CHAT_MESSAGE_SENDER_GROUP;

  @Prop({ type: String })
  message: string;

  @Prop({ type: FileSchema })
  file: FileSchema;

  @Prop({ type: String })
  mimeType: string;
}

const ChatSchema = SchemaFactory.createForClass(Chat);

export { ChatSchema, Chat };
