import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { MAKE_TYPE_ENUM, collectionsName } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
class Car extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: collectionsName.admin,
  })
  admin: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, enum: MAKE_TYPE_ENUM, required: true })
  makeType: MAKE_TYPE_ENUM;

  @Prop({ type: String })
  logo: string;
}

const CarSchema = SchemaFactory.createForClass(Car);

type CarDocument = {
  admin: Types.ObjectId;
  name: string;
  makeType: MAKE_TYPE_ENUM;
  logo: string;
};

export { CarSchema, Car, CarDocument };
