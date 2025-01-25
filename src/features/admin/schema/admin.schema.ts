import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { FileSchema } from 'src/features/common';
import { collectionsName } from 'src/features/constant';

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

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String, required: true })
  countryCode: string;

  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: String, required: true })
  state: string;

  @Prop({ type: String, required: true })
  address: string;

  @Prop({ type: FileSchema })
  avatar: FileSchema;
}

const AdminSchema = SchemaFactory.createForClass(Admin);

export class AdminDocument {
  _id: Types.ObjectId;
  username: string;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
}

export { AdminSchema, Admin };
