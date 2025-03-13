import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { ADMIN_CATEGORY, collectionsName } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
class Admin extends Document<Types.ObjectId> {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: collectionsName.user,
    required: true,
  })
  user: Types.ObjectId;

  @Prop({ type: String })
  username: string;

  @Prop({ type: String })
  companyName: string;

  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: String, enum: ADMIN_CATEGORY, default: ADMIN_CATEGORY.STANDARD })
  category: ADMIN_CATEGORY;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: Number, default: 0 })
  credits: number;

  @Prop({ type: String })
  vatNumber: string;

  @Prop({ type: Number })
  vatRate: number;

  @Prop({ type: String, required: true })
  countryCode: string;

  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: String })
  street: string;

  @Prop({ type: String, required: true })
  postcode: string;

  @Prop({ type: String })
  avatar: string;

  @Prop({ type: String })
  logo: string;

  //auto forward to ai-assist
  @Prop({ type: Boolean, default: false })
  aiAssist: boolean;
}

const AdminSchema = SchemaFactory.createForClass(Admin);

export class AdminDocument {
  _id: Types.ObjectId;
  username: string;
  category: ADMIN_CATEGORY;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  credits: number;
  phone: string;
  postcode: string;
  avatar: string;
  logo: string;
  aiAssist: boolean;
  countryCode: string;
  country: string;
  vatNumber: string;
  vatRate: number;
}

export { AdminSchema, Admin };
