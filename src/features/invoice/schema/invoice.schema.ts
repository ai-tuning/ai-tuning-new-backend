import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { collectionsName, PAYMENT_STATUS } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
class Invoice extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: collectionsName.admin })
  admin: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: collectionsName.customer })
  customer: Types.ObjectId;

  @Prop({ type: String, required: true })
  invoiceNumber: string;

  @Prop({ type: String })
  orderId: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: String, required: true })
  unitPrice: string;

  @Prop({ type: Number, required: true })
  totalPrice: number;

  @Prop({ type: Number, required: true, default: 0.0 })
  vat: number;

  @Prop({ type: Number })
  vatRate: number;

  @Prop({ type: String })
  customerVatNumber: string;

  @Prop({ type: String })
  adminVatNumber: string;

  @Prop({ type: Boolean, required: true, default: false })
  reverseCharge: boolean;

  @Prop({ type: Number, required: true })
  grandTotal: number;

  @Prop({ type: String, required: true, enum: PAYMENT_STATUS, default: PAYMENT_STATUS.UNPAID })
  status: PAYMENT_STATUS;

  @Prop({ type: Boolean, default: false })
  isEvcCredit: boolean;
}

const InvoiceSchema = SchemaFactory.createForClass(Invoice);

export { InvoiceSchema, Invoice };
