import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { FileSchema } from 'src/features/common';
import { FileModel } from 'src/features/common/schema/file.schema';
import { DTC_STATUS } from 'src/features/constant/enums/dtc-status';

@Schema({ timestamps: true, versionKey: false })
class Dtc extends Document {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
    admin: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
    customer: Types.ObjectId;

    @Prop({ type: String, required: true })
    id: string;

    @Prop({ type: String, required: true })
    originalFile: string;

    @Prop({ type: FileSchema })
    outputFile: FileModel;

    @Prop({ type: String, required: true })
    faultCodes: string;

    @Prop({ type: String, enum: DTC_STATUS, required: true, default: DTC_STATUS.WAITING })
    status: DTC_STATUS;
}

const DtcSchema = SchemaFactory.createForClass(Dtc);

export { DtcSchema, Dtc };
