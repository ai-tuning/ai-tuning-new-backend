import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { MAKE_TYPE_ENUM, collectionsName } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
class Script extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  admin: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: MAKE_TYPE_ENUM,
  })
  makeType: MAKE_TYPE_ENUM;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: collectionsName.car,
    required: true,
  })
  car: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: collectionsName.controller,
    required: true,
  })
  controller: Types.ObjectId;

  @Prop({ type: String, required: true })
  file: string;

  @Prop({ type: String, required: true })
  originalName: string;
}

const ScriptSchema = SchemaFactory.createForClass(Script);

export { Script, ScriptSchema };
