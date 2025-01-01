import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

  //createdAt time for calculating the expiration time
  createdAt: Date;
}

const VerificationEmailSchema = SchemaFactory.createForClass(VerificationEmail);
export { VerificationEmailSchema, VerificationEmail };
