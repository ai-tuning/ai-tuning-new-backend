import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

class Prices {
  @Prop({ type: Number, required: true, default: 0 })
  deactivation: number;

  @Prop({ type: Number, required: true, default: 0 })
  tuning: number;

  @Prop({ type: Number, required: true, default: 0 })
  special: number;
}

@Schema({ _id: false, versionKey: false, timestamps: true })
export class AdminPricing {
  @Prop({ type: Number, required: true })
  creditPrice: number;

  @Prop({ type: Prices, required: true })
  standard: Prices;

  @Prop({ type: Prices, required: true })
  premium: Prices;

  @Prop({ type: Prices, required: true })
  platinum: Prices;
}

export const AdminPricingSchema = SchemaFactory.createForClass(AdminPricing);
