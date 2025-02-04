import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class SolutionInformation {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  admin: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  solution: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  car: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;
}

export const SolutionSchema = SchemaFactory.createForClass(SolutionInformation);
