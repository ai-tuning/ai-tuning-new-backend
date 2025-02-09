import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { FileSchema } from 'src/features/common';
import { collectionsName, UserStatusEnum } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
class Customer extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: collectionsName.admin,
  })
  admin: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: collectionsName.admin,
    required: true,
  })
  user: Types.ObjectId;

  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: String, required: true })
  address: string;

  @Prop({ type: String, required: true })
  postcode: string;

  @Prop({ type: String })
  companyName: string;

  @Prop({ type: String, required: true })
  countryCode: string;

  @Prop({ type: String })
  state: string;

  @Prop({ type: Number, default: 0 })
  credits: number;

  @Prop({ type: FileSchema })
  avatar: FileSchema;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: collectionsName.customerType,
    required: true,
  })
  customerType: Types.ObjectId;

  @Prop({
    type: String,
    enum: UserStatusEnum,
    required: true,
    default: UserStatusEnum.ACTIVE,
  })
  status: UserStatusEnum;

  @Prop({ type: String })
  evcNumber: string;
}

const CustomerSchema = SchemaFactory.createForClass(Customer);

class CustomerDocument {
  _id: Types.ObjectId;
  admin: Types.ObjectId;
  user: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postCode: string;
  companyName: string;
  credits: number;
  avatar: {
    originalname: string;
    fileType: string;
    url: string;
  };
  customerType: Types.ObjectId;
  status: UserStatusEnum;
  evcNumber: string;
}

export { CustomerSchema, Customer, CustomerDocument };
