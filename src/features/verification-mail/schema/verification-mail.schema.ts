import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { VerificationEmailEnum } from 'src/features/constant';

@Schema({ versionKey: false, timestamps: true })
class VerificationEmail extends Document {
  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: Number, required: true })
  duration: number; //minutes

  @Prop({ type: Boolean, default: false })
  isUsed: boolean;

  @Prop({ type: String, enum: VerificationEmailEnum, default: false })
  verificationType: VerificationEmailEnum;

  //createdAt time for calculating the expiration time
  createdAt: Date;
}

const VerificationEmailSchema = SchemaFactory.createForClass(VerificationEmail);
export { VerificationEmailSchema, VerificationEmail };
