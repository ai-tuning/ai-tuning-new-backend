import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { AutoFlasher, AutoTuner, Kess3 } from 'src/features/common';
import { MAKE_TYPE_ENUM, SLAVE_TYPE } from 'src/features/constant';

/**
 * This is a temp record for tracking uploaded files for better file management
 * It can be used remove unnecessary files when a files is not used
 */
@Schema({ versionKey: false, timestamps: true })
export class TempFileService extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId })
  admin: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  service: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  customer: Types.ObjectId;

  @Prop({ type: String, required: true, enum: MAKE_TYPE_ENUM })
  makeType: MAKE_TYPE_ENUM;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  car: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  controller: Types.ObjectId;

  @Prop({ type: String, required: true })
  originalFile: string;

  @Prop({ type: String, required: true })
  originalFileName: string;

  @Prop({ type: String })
  decodedFile: string;

  @Prop({ type: String })
  iniFile: string;

  @Prop({ type: String })
  modWithoutEncoded: string;

  @Prop({ type: String })
  modFile: string;

  @Prop({ type: Kess3 })
  kess3: Kess3;

  @Prop({ type: AutoTuner })
  autoTuner: AutoTuner;

  @Prop({ type: AutoFlasher })
  autoFlasher: AutoFlasher;

  @Prop({ type: String, enum: SLAVE_TYPE })
  slaveType: SLAVE_TYPE;
}

export const TempFileServiceSchema = SchemaFactory.createForClass(TempFileService);
