import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { collectionsName } from 'src/features/constant';

@Schema({ versionKey: false, timestamps: true })
class CustomerType extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: collectionsName.admin,
    required: true,
  })
  admin: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;
}

const CustomerTypeSchema = SchemaFactory.createForClass(CustomerType);

export { CustomerTypeSchema, CustomerType };
