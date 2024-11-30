import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { FUEL_TYPE, SOLUTION_CATEGORY } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
export class Solution {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  admin: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, enum: SOLUTION_CATEGORY, required: true })
  category: SOLUTION_CATEGORY;

  @Prop({ type: [String], enum: FUEL_TYPE, required: true })
  fuelType: FUEL_TYPE[];
}

export const SolutionSchema = SchemaFactory.createForClass(Solution);
