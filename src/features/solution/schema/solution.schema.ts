import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { FUEL_TYPE, MAKE_TYPE_ENUM, SOLUTION_CATEGORY } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
export class Solution extends Document {
    @Prop({ type: mongoose.Schema.Types.ObjectId })
    admin: Types.ObjectId;

    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, required: true })
    aliasName: string;

    @Prop({ type: String, enum: SOLUTION_CATEGORY, required: true })
    category: SOLUTION_CATEGORY;

    @Prop({ type: [String], required: true, enum: FUEL_TYPE })
    fuelTypes: FUEL_TYPE[];

    @Prop({ type: [String], required: true, enums: MAKE_TYPE_ENUM })
    makeTypes: MAKE_TYPE_ENUM[];

    @Prop({ type: Number })
    mysqlId: number;
}

export const SolutionSchema = SchemaFactory.createForClass(Solution);
