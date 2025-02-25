import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { DTC_STATUS } from 'src/features/constant/enums/dtc-status';

@Schema({ timestamps: true, versionKey: false })
class Dtc extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  admin: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  customer: Types.ObjectId;

  @Prop({ type: String, required: true })
  originalFile: string;

  @Prop({ type: String, required: true })
  outputFile: string;

  @Prop({ type: String, required: true })
  faultCodes: string;

  @Prop({ type: String, enum: DTC_STATUS, required: true })
  status: DTC_STATUS;
}

const DtcSchema = SchemaFactory.createForClass(Dtc);

export { DtcSchema, Dtc };
