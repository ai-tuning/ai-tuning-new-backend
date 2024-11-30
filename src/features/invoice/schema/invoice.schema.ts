import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
class Invoice extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  admin: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  customer: Types.ObjectId;

  @Prop({ type: String, required: true })
  invoiceNumber: string;

  @Prop({ type: String, required: true })
  product: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, required: true })
  quantity: string;

  @Prop({ type: String, required: true })
  unitPrice: string;

  @Prop({ type: Number, required: true })
  totalPrice: number;

  @Prop({ type: Number, required: true, default: 0.0 })
  vat: number;

  @Prop({ type: Number, required: true })
  grantTotal: number;
}

const InvoiceSchema = SchemaFactory.createForClass(Invoice);

export { InvoiceSchema, Invoice };
