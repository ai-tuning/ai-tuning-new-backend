import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { AutoFlasher, AutoTuner, Kess3 } from 'src/features/common';
import { SLAVE_TYPE } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
class DecodeEncode extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  admin: Types.ObjectId;

  @Prop({ type: String, enum: SLAVE_TYPE, required: true })
  slaveType: SLAVE_TYPE;

  @Prop({ type: String, required: true })
  originalFile: string;

  @Prop({ type: String, required: true })
  decodedFile: string;

  @Prop({ type: String })
  encodedFile: string;

  @Prop({ type: String, default: 1000, required: true })
  documentId: string;

  @Prop({ type: Kess3 })
  kess3: Kess3;

  @Prop({ type: AutoTuner })
  autoTuner: AutoTuner;

  @Prop({ type: AutoFlasher })
  autoFlasher: AutoFlasher;
}

const DecodeEncodeSchema = SchemaFactory.createForClass(DecodeEncode);

export { DecodeEncodeSchema, DecodeEncode, Kess3, AutoFlasher, AutoTuner };
