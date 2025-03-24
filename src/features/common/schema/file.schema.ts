import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false, timestamps: false, _id: false })
export class FileModel {
    @Prop({ type: String, required: true })
    originalname: string;

    @Prop({ type: String, required: true })
    uniqueName: string;

    @Prop({ type: String, required: true })
    key: string;

    @Prop({ type: String })
    publicUrl?: string;
}

export const FileSchema = SchemaFactory.createForClass(FileModel);
