import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { CHAT_BELONG } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
class Chat extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  admin: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  customer: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  senderId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  receiverId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  serviceId: Types.ObjectId;

  @Prop({ type: String, enum: CHAT_BELONG, required: true })
  chatBelong: CHAT_BELONG;

  @Prop({ type: String })
  message: string;

  @Prop({ type: String })
  file: string;

  @Prop({ type: String })
  mimeType: string;
}

const ChatSchema = SchemaFactory.createForClass(Chat);

export { ChatSchema, Chat };
