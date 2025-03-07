import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { MAKE_TYPE_ENUM, collectionsName, SOLUTION_CATEGORY } from 'src/features/constant';
import { PRICING_TYPE_ENUM } from 'src/features/constant/enums/pricing-type.enum';

@Schema({ timestamps: false, versionKey: false, _id: false })
export class Item {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: collectionsName.customerType })
  customerType: Types.ObjectId;

  @Prop({ type: String, required: true, enum: MAKE_TYPE_ENUM })
  makeType: MAKE_TYPE_ENUM;

  @Prop({ type: String, required: true, enum: SOLUTION_CATEGORY })
  solutionCategory: SOLUTION_CATEGORY;

  @Prop({ type: Number, required: true, default: 0 })
  price: number;
}

const ItemSchema = SchemaFactory.createForClass(Item);

@Schema({ timestamps: false, versionKey: false, _id: false })
export class SolutionBasedItem {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: collectionsName.customerType })
  customerType: Types.ObjectId;

  @Prop({ type: String, required: true, enum: MAKE_TYPE_ENUM })
  makeType: MAKE_TYPE_ENUM;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: collectionsName.solution, required: true })
  solution: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 0 })
  price: number;
}

const SolutionBasedItemSchema = SchemaFactory.createForClass(SolutionBasedItem);

@Schema({ timestamps: false, versionKey: false, _id: false })
class PriceLimit {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: collectionsName.customerType })
  customerType: Types.ObjectId;

  @Prop({ type: String, required: true, enum: MAKE_TYPE_ENUM })
  makeType: MAKE_TYPE_ENUM;

  @Prop({ type: Number, required: true })
  maxPrice: number;

  @Prop({ type: Number, required: true })
  minPrice: number;
}

const PriceLimitSchema = SchemaFactory.createForClass(PriceLimit);

@Schema({ timestamps: true, versionKey: false })
export class Pricing {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  admin: Types.ObjectId;

  @Prop({ type: [PriceLimitSchema], required: true })
  priceLimits: PriceLimit[];

  //current enabled pricing type
  @Prop({ type: String, required: true, enum: PRICING_TYPE_ENUM, default: PRICING_TYPE_ENUM.CATEGORY_BASED })
  enabledPricingType: PRICING_TYPE_ENUM;

  //category based pricing
  @Prop({ type: [ItemSchema], required: true })
  items: Item[];

  //solution based pricing
  @Prop({ type: [SolutionBasedItemSchema], required: true })
  solutionItems: SolutionBasedItem[];
}

export const PricingSchema = SchemaFactory.createForClass(Pricing);
