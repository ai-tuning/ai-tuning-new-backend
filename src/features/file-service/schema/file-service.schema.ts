import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { AutoFlasher, AutoTuner, FileSchema, Kess3 } from 'src/features/common';
import { FileModel } from 'src/features/common/schema/file.schema';
import { collectionsName, FILE_SERVICE_STATUS, PAYMENT_STATUS, SLAVE_TYPE, WinOLS_STATUS } from 'src/features/constant';

//solution which are requested by the customer
export class Solutions {
    @Prop({ type: [mongoose.Schema.Types.ObjectId] })
    requested: Types.ObjectId[];

    @Prop({ type: [mongoose.Schema.Types.ObjectId] })
    automatic: Types.ObjectId[];
}

@Schema({ timestamps: false, versionKey: false, _id: false })
export class ModUpload {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: collectionsName.user })
    uploadedBy: Types.ObjectId;

    @Prop({ type: Date })
    date: Date;
}

const ModUploadSchema = SchemaFactory.createForClass(ModUpload);

@Schema({ timestamps: true, versionKey: false })
export class FileService extends Document {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
    admin: Types.ObjectId;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: collectionsName.customer,
        required: true,
    })
    customer: Types.ObjectId;

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

    @Prop({
        type: String,
        required: true,
    })
    uniqueId: String;

    /**
     * who operate or handle the service
     */
    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: collectionsName.user,
    })
    operator: Types.ObjectId;

    @Prop({
        type: FileSchema,
        required: true,
    })
    originalFile: FileModel;

    @Prop({
        type: FileSchema,
    })
    decodedFile: FileModel;

    @Prop({
        type: FileSchema,
        required: true,
    })
    iniFile: FileModel;

    @Prop({
        type: FileSchema,
    })
    modWithoutEncoded: FileModel;

    @Prop({
        type: FileSchema,
    })
    modFile: FileModel;

    @Prop({
        type: String,
    })
    comment: string;

    @Prop({
        type: String,
        enum: FILE_SERVICE_STATUS,
        required: true,
    })
    status: FILE_SERVICE_STATUS;

    @Prop({
        type: String,
        enum: WinOLS_STATUS,
    })
    winolsStatus: WinOLS_STATUS;

    @Prop({ type: Kess3 })
    kess3: Kess3;

    @Prop({ type: AutoTuner })
    autoTuner: AutoTuner;

    @Prop({ type: AutoFlasher })
    autoFlasher: AutoFlasher;

    @Prop({ type: String, enum: SLAVE_TYPE })
    slaveType: SLAVE_TYPE;

    @Prop({ type: Number, required: true, default: 0 })
    credits: number;

    @Prop({ type: Number })
    adminCredits: number;

    @Prop({ type: String, required: true, default: PAYMENT_STATUS.UNPAID })
    paymentStatus: string;

    @Prop({ type: Solutions, required: true })
    solutions: Solutions;

    @Prop({ type: String, required: true })
    carModel: string;

    @Prop({ type: String, required: true })
    engine: string;

    @Prop({ type: String, required: true })
    power: string;

    @Prop({ type: String, required: true })
    year: string;

    @Prop({ type: String, required: true })
    gearbox: string;

    @Prop({ type: String, required: true })
    fuel: string;

    @Prop({ type: String, required: true })
    readingTool: string;

    @Prop({ type: String })
    vin: string;

    @Prop({ type: String, required: true })
    exactEcu: string;

    @Prop({ type: ModUploadSchema })
    modUpload: ModUpload;

    @Prop({ type: Boolean, default: false })
    aiAssist: boolean;

    @Prop({ type: Number })
    mysqlId: number;
}

export const FileServiceSchema = SchemaFactory.createForClass(FileService);
