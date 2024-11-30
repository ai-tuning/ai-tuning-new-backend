import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { collectionsName, UserStatusEnum } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
class Customer extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: collectionsName.admin,
    required: true,
  })
  admin: Types.ObjectId;

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
  postCode: string;

  @Prop({ type: String })
  companyName: string;

  @Prop({ type: Number, default: 0 })
  credits: number;

  @Prop({ type: String })
  avatar: string;

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

export { CustomerSchema, Customer };
