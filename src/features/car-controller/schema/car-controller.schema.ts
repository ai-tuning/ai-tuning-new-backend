import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

@Schema({ versionKey: false, timestamps: true })
class CarController extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  admin: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  car: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;
}

const CarControllerSchema = SchemaFactory.createForClass(CarController);

type ControllerDocument = {
  admin: Types.ObjectId;
  car: Types.ObjectId;
  name: string;
};

export { CarControllerSchema, CarController, ControllerDocument };
