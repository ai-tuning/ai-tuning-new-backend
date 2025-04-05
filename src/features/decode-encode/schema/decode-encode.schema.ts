import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { AutoFlasher, AutoTuner, FileSchema, Kess3 } from 'src/features/common';
import { FileModel } from 'src/features/common/schema/file.schema';
import { FlexSlave } from 'src/features/common/schema/slave.schema';
import { SLAVE_TYPE } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
class DecodeEncode extends Document {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
    admin: Types.ObjectId;

    @Prop({ type: String, enum: SLAVE_TYPE, required: true })
    slaveType: SLAVE_TYPE;

    @Prop({ type: FileSchema, required: true })
    originalFile: FileModel;

    @Prop({ type: FileSchema, required: true })
    decodedFile: FileModel;

    @Prop({ type: FileSchema })
    encodedFile: FileModel;

    @Prop({ type: String, required: true })
    uniqueId: string;

    @Prop({ type: Kess3 })
    kess3: Kess3;

    @Prop({ type: AutoTuner })
    autoTuner: AutoTuner;

    @Prop({ type: AutoFlasher })
    autoFlasher: AutoFlasher;

    @Prop({ type: FlexSlave })
    flexSlave: FlexSlave;
}

const DecodeEncodeSchema = SchemaFactory.createForClass(DecodeEncode);

export { DecodeEncodeSchema, DecodeEncode, Kess3, AutoFlasher, AutoTuner };
