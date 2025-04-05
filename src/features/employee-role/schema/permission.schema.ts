import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Permission {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
    admin: Types.ObjectId;

    @Prop({ type: Boolean, required: true })
    dashboard: boolean;

    @Prop({ type: Boolean, required: true })
    fileServices: boolean;

    @Prop({ type: Boolean, required: true })
    tickets: boolean;

    @Prop({ type: Boolean, required: true })
    addSolution: boolean;

    @Prop({ type: Boolean, required: true })
    solutions: boolean;

    @Prop({ type: Boolean, required: true })
    scripts: boolean;

    @Prop({ type: Boolean, required: true })
    customers: boolean;

    @Prop({ type: Boolean, required: true })
    customerTypes: boolean;

    @Prop({ type: Boolean, required: true })
    employees: boolean;

    @Prop({ type: Boolean, required: true })
    roles: boolean;

    @Prop({ type: Boolean, required: true })
    prices: boolean;

    @Prop({ type: Boolean, required: true })
    invoices: boolean;

    @Prop({ type: Boolean, required: true })
    purchaseInvoices: boolean;

    @Prop({ type: Boolean, required: true })
    shop: boolean;

    @Prop({ type: Boolean, required: true })
    schedule: boolean;

    @Prop({ type: Boolean, required: true })
    notice: boolean;

    @Prop({ type: Boolean, required: true })
    credentials: boolean;

    //super admin employee
    @Prop({ type: Boolean, default: false })
    adminPricing: boolean;

    @Prop({ type: Boolean, default: false })
    adminInvoices: boolean;

    @Prop({ type: Boolean, default: false })
    admins: boolean;

    @Prop({ type: Boolean, default: false })
    slaveDecodeEncode: boolean;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
