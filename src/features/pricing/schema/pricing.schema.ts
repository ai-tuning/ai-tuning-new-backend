import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { CAR_TYPE_ENUM, collectionsName, SOLUTION_CATEGORY } from 'src/features/constant';

export class Item {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: collectionsName.customerType })
  customerType: Types.ObjectId;

  @Prop({ type: String, required: true, enum: CAR_TYPE_ENUM })
  makeType: CAR_TYPE_ENUM;

  @Prop({ type: SOLUTION_CATEGORY, required: true })
  solutionCategory: SOLUTION_CATEGORY;

  @Prop({ type: Number, required: true, default: 0 })
  price: number;
}

@Schema({ timestamps: true, versionKey: false })
export class Pricing {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  admin: Types.ObjectId;

  @Prop({ type: Array<Item>, required: true })
  items: Item[];
}

export const PricingSchema = SchemaFactory.createForClass(Pricing);
