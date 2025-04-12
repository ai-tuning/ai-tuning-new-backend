import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false, timestamps: false, versionKey: false })
class Prices {
    @Prop({ type: Number, required: true, default: 0 })
    deactivation: number;

    @Prop({ type: Number, required: true, default: 0 })
    tuning: number;

    @Prop({ type: Number, required: true, default: 0 })
    special: number;

    @Prop({ type: Number, required: true, default: 0 })
    minPrice: number;

    @Prop({ type: Number, required: true, default: 0 })
    maxPrice: number;
}

const PricesSchema = SchemaFactory.createForClass(Prices);

@Schema({ _id: false, timestamps: false, versionKey: false })
class PricingCategory {
    @Prop({ type: PricesSchema, required: true })
    standard: Prices;
    @Prop({ type: PricesSchema, required: true })
    premium: Prices;
    @Prop({ type: PricesSchema, required: true })
    platinum: Prices;
}

const PricingCategorySchema = SchemaFactory.createForClass(PricingCategory);

@Schema({ _id: false, versionKey: false, timestamps: true })
export class AdminPricing {
    @Prop({ type: Number, required: true, default: 0 })
    creditPrice: number;

    @Prop({ type: Number, required: true, default: 0 })
    perFilePrice: number;

    @Prop({ type: PricingCategorySchema, required: true })
    car: PricingCategory;

    @Prop({ type: PricingCategorySchema, required: true })
    bike: PricingCategory;

    @Prop({ type: PricingCategorySchema, required: true })
    truck_agri_construction: PricingCategory;
}

export type AdminPricingDocument = HydratedDocument<AdminPricing>;

export const AdminPricingSchema = SchemaFactory.createForClass(AdminPricing);
export class AdminPrices extends Prices {}
