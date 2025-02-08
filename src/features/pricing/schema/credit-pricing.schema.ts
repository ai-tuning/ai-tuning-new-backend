import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

class EvcPricingItem {
  @Prop({ type: mongoose.Schema.Types.ObjectId })
  customerType: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  price: number;
}

@Schema({ versionKey: false, timestamps: true })
export class CreditPricing {
  @Prop({ type: mongoose.Schema.Types.ObjectId })
  admin: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  creditPrice: number;

  @Prop({ type: [EvcPricingItem] })
  evcPrices: EvcPricingItem[];
}

export const CreditPricingSchema = SchemaFactory.createForClass(CreditPricing);
